/** Luna engine */
namespace Luna {
	/** Internal interface */
	export namespace Internal {
		/** Unique identifier generated using `Internals.gen_id()` */
		export type UniqueIdentifier = `${number}-${number}-${number}-${number}`

		/**
		 * Pauses the thread for the given amount of time
		 * @param ms Milliseconds to wait
		 */
		export function sleep(ms = 0) {
			return new Promise((res) => setInterval(res, ms))
		}
		/** Generates a unique ID using four unsigned integers and the `crypto` api */
		export function gen_id() {
			let nums = crypto.getRandomValues(new Uint16Array(4))
			let strs = Array.from(nums).map((n) => `${n}`.padStart(5, "0"))
			return strs.join("-") as UniqueIdentifier
		}
	}
	/** Event interface */
	export namespace Event {
		/** Constructs a new event handler type */
		export interface TypeConstructor<T extends string, P> {
			name: T
			payload: P
			source: string
			timestamp: number
		}
		/** List of event payloads */
		export interface PayloadMap {
			start: { frame: typeof frame }
			stop: { code: number; frame: typeof frame; fps: typeof fps }
			frame: { delta: number; frame: typeof frame }
			update: { delta: number; frame: typeof frame }
			render: { delta: number; frame: typeof frame; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
			error: { name: string; reason: string; stack?: string }
		}
		/** Listener entry for use in event handling */
		export interface ListenerEntry<T extends keyof PayloadMap> {
			id: Internal.UniqueIdentifier
			callback: (event: TypeConstructor<T, PayloadMap[T]>) => any
		}

		/** List of all event listeners */
		const events: Map<keyof PayloadMap, ListenerEntry<any>[]> = new Map()

		/**
		 * Adds an event listener
		 * @param event Event name
		 * @param callback Listener callback function
		 * @returns Listener ID
		 */
		export function on<T extends keyof PayloadMap>(event: T, callback: (event: TypeConstructor<T, PayloadMap[T]>) => any) {
			let arr = events.get(event)
			let entry = { callback, id: Internal.gen_id() } as ListenerEntry<typeof event>
			events.set(event, [...arr, entry])
			return entry.id
		}
		/**
		 * Removes an event listener
		 * @param event Event name
		 * @param id Listener ID
		 * @returns Whether the listener was removed
		 */
		export function remove(event: keyof PayloadMap, id: Internal.UniqueIdentifier) {
			let arr = events.get(event)
			if (!arr) return false
			arr = arr.splice(arr.findIndex((entry) => entry.id === id))
			events.set(event, arr)
			return true
		}
		/**
		 * Triggers an event
		 * @param event Event type
		 * @param payload Event payload
		 * @param source Event source
		 */
		export function trigger<T extends keyof PayloadMap>(event: T, payload: PayloadMap[T], source: string) {
			if (!events.has(event)) return

			const contents = {
				name: event,
				payload,
				source,
				timestamp: performance.now(),
			} as TypeConstructor<T, PayloadMap[T]>

			events.get(event).forEach((entry) => entry.callback(contents))
		}
	}
	/** Class interface */
	export namespace Class {
		/** @class Queue */
		export class Queue<C> {
			private contents: Map<Internal.UniqueIdentifier, C> = new Map()

			/**
			 * Adds an item to the queue
			 * @param entry Item to add
			 * @param id ID of the item
			 * @returns Item ID
			 */
			public request(entry: C, id?: Internal.UniqueIdentifier) {
				id ??= Internal.gen_id()
				this.contents.set(id, entry)
				return id
			}
			/**
			 * Removes an item from the queue
			 * @param id ID of the item
			 * @returns Whether the item was removed
			 */
			public remove(id: Internal.UniqueIdentifier) {
				return this.contents.delete(id)
			}
			/** Clears the queue */
			public clear() {
				this.contents.clear()
			}
			/** Returns an array of the entries */
			public array() {
				return Array.of(...this.contents.values())
			}
		}
		/** @class Accumulator */
		export class Accumulator implements Engine.Updatable {
			private current = 0
			private active = false

			/**
			 * Creates a new accumulator
			 * @param target Target value
			 */
			constructor(private target: number) {}

			/**
			 * Iterates the accumulator, checking for ready state
			 * @param delta Time interval
			 */
			public async update(delta) {
				this.current += delta

				if (this.active) this.active = false

				if (this.current >= this.target) {
					this.current -= this.target
					this.active = true
				}
			}
			/**
			 * Sets the accumulator's target
			 * @param val Target value
			 */
			public set(val: number) {
				this.target = val
			}
			/** Resets the accumulator */
			public reset() {
				this.current = 0
			}
			/** Returns whether the accumulator has been triggered */
			public ready() {
				return this.active
			}
		}
		/** @class Range */
		export class Range {
			private min = { val: 0, eql: true }
			private max = { val: 1, eql: true }

			/**
			 * Creates a new range
			 * @param min Minimum value
			 * @param include_min Whether to include the value in the range
			 * @param max Maximum value
			 * @param include_max Whether to include the value in the range
			 */
			constructor(min: number, include_min: boolean, max: number, include_max: boolean) {
				this.min = { val: min, eql: include_min }
				this.max = { val: max, eql: include_max }
			}

			/**
			 * Creates a range from the given string
			 * @param str Range string
			 * @returns Range instance
			 */
			public static from(str: string) {
				if (!/^!?\d+?-!?\d+?$/.test(str)) throw "Invalid range input"
				let raw_min = /^!?\d+?(?=-!?\d+?$)/.exec(str)[0]
				let raw_max = /(?<=^!?\d+?-)!?\d+?$/.exec(str)[0]

				let min = +raw_min.replace("!", "")
				let max = +raw_max.replace("!", "")
				let eql_min = !raw_min.startsWith("!")
				let eql_max = !raw_max.startsWith("!")

				return new Range(min, eql_min, max, eql_max)
			}

			/**
			 * Checks whether the given number is within the range
			 * @param n Number to check
			 * @returns Whether the number is within the range
			 */
			public includes(n: number) {
				if (n > this.min.val) {
					if (this.max.eql && n <= this.max.val) return true
					else if (n < this.max.val) return true
				} else if (this.min.eql && n >= this.min.val) {
					if (this.max.eql && n <= this.max.val) return true
					else if (n < this.max.val) return true
				} else return false
			}
			/** Gets a random number from the range (NOTE: min values are always included) */
			public get_random() {
				let min = this.min.val
				let max = this.max.val + +this.max.eql
				let mod = max - min

				return Math.random() * mod + min
			}
		}
		/** @class Vector 2D */
		export class Vector2D {
			/** Vector of (0, 0) */
			public static zero = new Vector2D()
			/** Vector of (1, 1) */
			public static unit = new Vector2D(1, 1)

			/** X value */
			public x: number
			/** Y value */
			public y: number

			/**
			 * Creates a new 2D vector
			 * @param x X value
			 * @param y Y value
			 */
			constructor(x = 0, y = 0) {
				this.x = x
				this.y = y
			}

			/** Creates a copy of the vector instance */
			public copy() {
				return new Vector2D(this.x, this.y)
			}
			/** Multiplies both values by -1 */
			public inverse() {
				return new Vector2D(-this.x, -this.y)
			}
			/** Sets both values to their reciprocal */
			public reciprocal() {
				return new Vector2D(1 / this.x, 1 / this.y)
			}
			/** Returns a string representation of the instance */
			public to_string() {
				return JSON.stringify(this, null, "\t")
			}
			/** Converts to a 2D vector */
			public to_2d() {
				return new Vector2D(this.x, this.y)
			}
			/** Converts to a 3D vector */
			public to_3d() {
				let z = this instanceof Vector3D ? this.z : 0
				return new Vector3D(this.x, this.y, z)
			}

			/** Sets the values of the instance */
			public set(x = this.x, y = this.y) {
				this.x = x
				this.y = y
				return this
			}
			/** Adds to the values of the instance */
			public add(x = 0, y = 0) {
				this.x += x
				this.y += y
				return this
			}
			/** Subtracts from the values of the instance */
			public sub(x = 0, y = 0) {
				this.x -= x
				this.y -= y
				return this
			}
			/** Multiplies the values of the instance */
			public mul(x = 1, y = 1) {
				this.x *= x
				this.y *= y
				return this
			}
			/** Divides the values of the instance */
			public div(x = 1, y = 1) {
				this.x /= x
				this.y /= y
				return this
			}
			/** Raises the values of the instance to a power */
			public pow(x = 1, y = 1) {
				this.x **= x
				this.y **= y
				return this
			}
			/** Divides the values of the instance and sets them to the remainder */
			public mod(x = 1, y = 1) {
				this.x %= x
				this.y %= y
				return this
			}
		}
		/** @class Vector 3D */
		export class Vector3D extends Vector2D {
			/** Vector of (0, 0, 0) */
			public static zero = new Vector3D()
			/** Vector of (1, 1, 1) */
			public static unit = new Vector3D(1, 1, 1)

			/** Z value */
			public z: number

			/** Creates a new 3D vector */
			constructor(x = 0, y = 0, z = 0) {
				super(x, y)
				this.z = z
			}

			/** Creates a copy of the vector instance */
			public override copy() {
				return new Vector3D(this.x, this.y, this.z)
			}
			/** Multiplies both values by -1 */
			public override inverse() {
				return new Vector3D(-this.x, -this.y, -this.z)
			}
			/** Sets both values to their reciprocal */
			public override reciprocal() {
				return new Vector3D(1 / this.x, 1 / this.y, 1 / this.z)
			}

			/** Sets the values of the instance */
			public override set(x = this.x, y = this.y, z = this.z) {
				this.x = x
				this.y = y
				this.z = z
				return this
			}
			/** Adds to the values of the instance */
			public override add(x = 0, y = 0, z = 0) {
				this.x += x
				this.y += y
				this.z += z
				return this
			}
			/** Subtracts from the values of the instance */
			public override sub(x = 0, y = 0, z = 0) {
				this.x -= x
				this.y -= y
				this.z -= z
				return this
			}
			/** Multiplies the values of the instance */
			public override mul(x = 1, y = 1, z = 1) {
				this.x *= x
				this.y *= y
				this.z *= z
				return this
			}
			/** Divides the values of the instance */
			public override div(x = 1, y = 1, z = 1) {
				this.x /= x
				this.y /= y
				this.z /= z
				return this
			}
			/** Raises the values of the instance to a power */
			public override pow(x = 1, y = 1, z = 1) {
				this.x **= x
				this.y **= y
				this.z **= z
				return this
			}
			/** Divides the values of the instance and sets them to the remainder */
			public override mod(x = 1, y = 1, z = 1) {
				this.x %= x
				this.y %= y
				this.z %= z
				return this
			}
		}
	}
	/** Display interface */
	export namespace Display {
		/** Interface that allows for display rendering */
		export interface Renderable {
			/**
			 * Renders the instance
			 * @param delta Time since last frame
			 * @param ctx Rendering context
			 */
			render(delta: number, ctx: CanvasRenderingContext2D): Promise<any>
		}

		const queue = new Class.Queue<Renderable>()
		let canvas = document.querySelector("canvas")
		let ctx = canvas.getContext("2d")

		/** Initializes the display */
		export function init() {
			if (!canvas || !ctx) throw "Unable to initialize display"
			ctx.imageSmoothingEnabled = false
		}
		/** Resizes the canvas to fit the screen */
		export function autofit() {
			let { clientWidth: w, clientHeight: h } = document.documentElement
			canvas.setAttribute("width", `${w}px`)
			canvas.setAttribute("height", `${h}px`)
		}
		/**
		 * Renders all items in the display queue
		 * @param delta Time since last frame
		 */
		export function render(delta: number) {
			let { clientWidth: dw, clientHeight: dh } = document.documentElement
			let { width: cw, height: ch } = canvas
			if (cw !== dw || ch !== dh) autofit()

			ctx.beginPath()
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			queue.array().forEach(async (item) => item.render(delta, ctx))
			ctx.closePath()

			Event.trigger("render", { canvas, ctx, delta, frame }, "Luna.Display.render")
		}
	}
	/** Engine interface */
	export namespace Engine {
		/** Interface that allows for engine processing */
		export interface Updatable {
			/**
			 * Updates the instance
			 * @param delta Time since last frame
			 */
			update(delta: number): Promise<any>
		}

		const queue = new Class.Queue<Updatable>()

		/**
		 * Updates all items in the update queue
		 * @param delta Time since last frame
		 */
		export async function update(delta: number) {
			queue.array().forEach(async (item) => await item.update(delta))

			Event.trigger("update", { delta, frame }, "Luna.Engine.update")
		}
	}
	/** Audio interface */
	export namespace Audio {
		/** Music categories for use in volume scaling */
		export type Category = "general" | "effect" | "music"

		/** Interface that allows for audio emitting */
		export interface Playable {
			element: HTMLAudioElement
			category: Category
		}

		const queue = new Class.Queue<Playable>()

		/**
		 * Loads a sound for later playback
		 * @param category Sound category
		 * @param src Sound source
		 * @param volume Sound volume
		 * @returns Unique sound ID
		 */
		export async function load(category: Category, src: string, volume: number) {
			let element = document.createElement("audio")
			element.src = src
			element.volume = volume
			element.load()

			return queue.request({ category, element })
		}
	}

	/** Whether the engine is running */
	let running = false
	/** Frame data */
	let frame = { current: 0, id: 0, last: 0 }
	/** Framerate data */
	let fps: number[] = []
	/** Internal settings */
	let settings = { log_fps: true, log_interval: 30 }

	/** Prints fps data to the console */
	export function print_fps() {
		if (fps.length === 0) return

		const sum = fps.reduce((p, c) => p + c)
		const avg = sum / fps.length
		const frt = 1000 / avg

		console.log(`${frt.toFixed(1)} fps\t${avg.toFixed(1)} ms`)
	}
	/**
	 * Requests a new frame
	 * @param vsync Whether vsync is enabled
	 */
	export async function request_frame(vsync = true) {
		if (!running) return

		if (vsync) {
			frame.id = requestAnimationFrame(async (time) => await process(time, vsync))
		} else {
			// acts as a buffer to prevent the thread from halting
			await Internal.sleep()
			await process(performance.now())
		}
	}
	/** Starts the engine process */
	export function start(vsync = true) {
		running = true

		request_frame(vsync)

		Event.trigger("start", { frame }, "Luna.start")
	}
	/**
	 * Stops the engine process
	 * @param code Stop code
	 */
	export function stop(code = 0, vsync = true) {
		running = false

		if (vsync) cancelAnimationFrame(frame.id)

		Event.trigger("stop", { code, fps, frame }, "Luna.stop")

		fps = []
		frame = { current: 0, id: 0, last: 0 }

		console.log(`Process stopped (${code})`)
	}
	/**
	 * Processes a frame
	 * @param time Current time
	 */
	export async function process(time: number, vsync = true) {
		if (!running) return

		let delta = time - frame.last

		if (settings.log_fps) {
			if (frame.last !== 0) {
				fps.push(frame.last)
			}
			if (fps.length >= settings.log_interval) {
				print_fps()
				fps = []
			}
		}

		frame.last = time
		frame.current++

		Event.trigger("frame", { delta, frame }, "Luna.process")

		await request_frame(vsync)
	}
}
