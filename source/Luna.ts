/* eslint-disable @typescript-eslint/no-namespace */

/** Luna Engine */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Luna {
	/** Describes render queue item */
	export interface RenderQueueable {
		/**
		 * Renders an item
		 * @param delta Time since last frame
		 * @param context Rendering context
		 */
		render(delta: number, context: CanvasRenderingContext2D): Promise<unknown>
	}
	/** Describes update */
	export interface UpdateQueueable {
		/**
		 * Updates an item
		 * @param delta Time since last frame
		 */
		update(delta: number): Promise<unknown>
	}

	/** Queue class */
	export class Queue<C> {
		/** Contents of the queue */
		private list: Map<Internal.UID, C> = new Map()

		/**
		 * Creates a queue from the given items
		 * @param items Item to queue
		 * @returns New queue
		 */
		public static from<C>(...items: C[]) {
			const queue = new Queue<C>()
			items.forEach((item) => queue.request(item))
			return queue
		}

		/**
		 * Adds or overwrites a item
		 * @param item Item to add
		 * @param id Item ID, if overwriting
		 * @returns Item ID
		 */
		public request(item: C, uid = Internal.genUID()) {
			this.list.set(uid, item)
			return uid
		}
		/**
		 * Removes an item from the queue
		 * @param id Item ID
		 * @returns Whether the item could be removed
		 */
		public remove(uid: Internal.UID) {
			return this.list.delete(uid)
		}
		/** Clears the queue */
		public clear() {
			this.list.clear()
		}
		/**
		 * Checks for the given ID within the queue
		 * @param id Item ID
		 */
		public hasUID(uid: Internal.UID) {
			return this.list.has(uid)
		}
		/**
		 * Fetches the ID of an item from the queue
		 * @param item Item
		 */
		public getUID(item: C) {
			const index = this.array().indexOf(item)
			return Array.from(this.list.keys())[index]
		}
		/**
		 * Checks for the given item within the queue
		 * @param item Item
		 */
		public hasItem(item: C) {
			return this.array().includes(item)
		}
		/** Retrieves the queue contents */
		public array() {
			return Array.from(this.list.values())
		}
		/**
		 * Runs the callback function once for each item in the queue
		 * @param callback Callback function
		 */
		public forEach(callback: (value: C, key: Internal.UID) => unknown) {
			this.list.forEach(callback)
		}
	}

	/** Engine internals */
	export namespace Internal {
		/** Unique identifier */
		export type UID = `${number}-${number}-${number}-${number}`

		/** Generates a unique identifier */
		export function genUID(): UID {
			// maximum length of 5 characters
			const nums = crypto.getRandomValues(new Uint16Array(4))
			// ensure all numbers are 5 digits long
			const strs = Array.from(nums).map((n) => `${n}`.padStart(5, "0"))
			// output a new UID, fresh out of the oven
			return strs.join("-") as UID
		}
		/**
		 * Pauses the thread for the given amount of time
		 * @param ms Milliseconds
		 */
		export function sleep(ms = 0) {
			return new Promise((res) => setTimeout(res, ms))
		}

		export function error(source: string, name: string, reason: string, stack?: string) {
			const err = new Error()
			err.name = name
			err.message = reason
			err.stack = stack

			Event.dispatch("error", { name, reason, stack }, source)

			throw err
		}
	}
	/** Event handler */
	export namespace Event {
		/** Constructs a new event payload */
		export interface EventConstructor<T extends string, P> {
			name: T
			content: P
			source: string
			time: number
		}
		/** List of event contents */
		export interface EventMap {
			start: { frame: number }
			stop: { code: number; frame: number }
			frame: { delta: number; frame: number }
			error: { name: string; reason: string; stack?: string }
		}

		/** Defines an event listener callback function */
		export type EventCallback<T extends keyof EventMap> = (event: EventConstructor<T, EventMap[T]>) => unknown

		/** List of all event listeners */
		const events: Map<keyof EventMap, Queue<EventCallback<keyof EventMap>>> = new Map()

		/**
		 * Triggers an event
		 * @param name Event name
		 * @param content Event contents
		 * @param source Event source
		 */
		export function dispatch<T extends keyof EventMap>(name: T, content: EventMap[T], source = "Luna") {
			if (!events.has(name)) return

			// call all listener callback functions
			events.get(name).forEach((value) => value({ content, name, source, time: performance.now() }))
		}
		/**
		 * Adds an event listener
		 * @param name Event name
		 * @param callback Listener callback
		 * @returns Event unique ID
		 */
		export function addListener<T extends keyof EventMap>(name: T, callback: EventCallback<T>): Internal.UID {
			const queue = events.get(name) ?? new Queue<EventCallback<T>>()
			return queue.request(callback)
		}
		/**
		 * Removes an event listener
		 * @param name Event name
		 * @param uid Listener UID
		 * @returns Whether the item could be removed
		 */
		export function removeListener(name: keyof EventMap, uid: Internal.UID) {
			return !!events.get(name)?.remove(uid)
		}
	}
	/** Engine process */
	export namespace Process {
		/** Stores frame information */
		export const frame = { current: 0, id: 0, last: 0 }
		/** Stores display information */
		export const Display = {
			canvas: undefined as HTMLCanvasElement,
			ctx: undefined as CanvasRenderingContext2D,
		}
		/** Rendering queue */
		export const updateQueue = new Queue<UpdateQueueable>()
		/** Updating queue */
		export const renderQueue = new Queue<RenderQueueable>()
		/** Whether the engine is running */
		export let running = false

		/**
		 * Queues a frame to be processed
		 * @param vsync Whether V-Sync is enabled
		 */
		export async function queueFrame(vsync = false) {
			// ensure engine is running
			if (!running) return

			if (vsync) {
				// update frame id to allow cancellation on stop
				frame.id = requestAnimationFrame((time) => loop(time, vsync))
			} else {
				// this sleep function prevents the thread from halting
				await Internal.sleep()
				loop(performance.now(), vsync)
			}
		}
		/** Initializes the engine */
		export function init() {
			console.log(`Luna engine, created by Ethan Lynch`)

			// fetch canvas element
			Display.canvas = document.querySelector("canvas")
			if (!Display.canvas) throw "Unable to find canvas"

			// fetch rendering context
			Display.ctx = Display.canvas.getContext("2d")
			if (!Display.ctx) throw "Unable to fetch canvas context"

			start()
		}
		/**
		 * Starts the engine process
		 * @param vsync Whether V-Sync is enabled
		 */
		export function start(vsync = false) {
			// begin process
			running = true
			queueFrame(vsync)

			// dispatch event
			Event.dispatch("start", { frame: frame.current })
		}
		/**
		 * Stops the engine process
		 * @param code Exit code
		 * @param vsync Whether V-Sync is enabled
		 */
		export function stop(code = 0, vsync = false) {
			// stop process
			if (vsync) cancelAnimationFrame(frame.id)
			running = false

			// reset variables
			frame.current = 0
			frame.id = 0
			frame.last = 0
			updateQueue.clear()
			renderQueue.clear()

			// dispatch event
			Event.dispatch("stop", { code, frame: frame.current })
		}
		/**
		 * Main process loop
		 * @param time Current time from `performance.now()`
		 * @param vsync Whether V-Sync is enabled
		 */
		export async function loop(time = 0, vsync = false) {
			if (!running) return

			// calculate delta
			const delta = time - frame.last
			frame.last = time
			frame.current++

			// update and render all queued items
			updateQueue.forEach(async (item) => await item.update(delta))

			// open and close context path before rendering to prevent lag
			Display.ctx.beginPath()
			renderQueue.forEach(async (item) => await item.render(delta, Display.ctx))
			Display.ctx.closePath()

			// dispatch event
			Event.dispatch("frame", { delta, frame: frame.current })

			queueFrame(vsync)
		}
	}
	/** Engine classes */
	export namespace Class {
		/** Vector class */
		export class Vector {
			/**
			 * Creates a new vector
			 * @param x X value
			 * @param y Y value
			 */
			constructor(public x = 0, public y = 0) {}

			/** Creates a copy of the vector */
			public copy() {
				return new Vector(this.x, this.y)
			}
			/** Multiplies both values by -1 */
			public invert() {
				this.x *= -1
				this.y *= -1
				return this
			}
			/** Sets both values to their reciprocal */
			public reciprocal() {
				this.x = 1 / this.x
				this.y = 1 / this.y
				return this
			}
			/** Returns the magnitude of the vector */
			public magnitude() {
				return Math.sqrt(this.x ** 2 + this.y ** 2)
			}
			/** Calculates the vector's normal */
			public normal() {
				const mag = this.magnitude()

				// prevent dividing by 0
				if (mag === 0) return this
				else return new Vector(this.x / mag, this.y / mag)
			}

			/**
			 * Adds to the vector
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public add(x = 0, y = 0) {
				this.x += x
				this.y += y
				return this
			}
			/**
			 * Multiplies to the vector
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public multiply(x = 1, y = 1) {
				this.x *= x
				this.y *= y
				return this
			}
			/**
			 * Raises the vector to a power
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public power(x = 1, y = 1) {
				this.x **= x
				this.y **= y
				return this
			}
			/**
			 * Subtracts from the vector
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public subtract(x = 0, y = 0) {
				return this.add(-x, -y)
			}
			/**
			 * Divides from the vector
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public divide(x = 1, y = 1) {
				return this.multiply(1 / x, 1 / y)
			}
			/**
			 * Finds the root of the vector
			 * @param x X value
			 * @param y Y value
			 * @returns Vector
			 */
			public root(x = 1, y = 1) {
				return this.power(1 / x, 1 / y)
			}
		}
	}
}
