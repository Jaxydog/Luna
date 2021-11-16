namespace Luna_old {
	/** Whether the engine is currently running */
	export let running = false
	/** Engine configuration */
	export const settings = {
		/** Whether to log current FPS */
		logfps: false,
		/** Inverval between fps logs */
		loginterval: 10,
		/** Whether to log the average FPS on stop */
		logavg: true,
		/** Whether to enable vsync */
		vsync: false,
		/** Master sound volume */
		volume: 0.25,
	}
	/** Developer settings */
	export let dev = {
		/** Whether dev mode is enabled */
		enabled: false,
		/** Frames to process before exiting */
		runtime: 10,
	}

	/** Handles internal events */
	export namespace Event {
		/** Constructs an event handler type */
		export interface TypeConstructor<T extends string, P> {
			/** Event name */
			name: T
			/** Event payload */
			payload: P
			/** Event function source */
			source: string
			/** Event deployment timestamp */
			timestamp: number
		}
		/** List of initialized event types */
		export interface TypeMap {
			start: TypeConstructor<"start", { frame: typeof Internals.frame }>
			stop: TypeConstructor<"stop", { code: number; frame: typeof Internals.frame; fps: typeof Internals.fps }>
			update: TypeConstructor<"update", { delta: number; frame: typeof Internals.frame }>
			render: TypeConstructor<"render", { delta: number; frame: typeof Internals.frame; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>
			error: TypeConstructor<"error", { name: string; reason: string; stack?: string }>
		}
		/** Listener entry for use in event handling */
		export interface ListenerEntry {
			/** Listener ID */
			id: Internals.UniqueIdentifier
			/** Listener callback function */
			callback: Function
		}

		/** Map of all event listeners */
		export const events: Map<keyof TypeMap, ListenerEntry[]> = new Map()

		/**
		 * Adds an event listener
		 * @param event Event name
		 * @param callback Listener callback function
		 * @returns Listener ID
		 */
		export function on<K extends keyof TypeMap>(event: K, callback: (event: TypeMap[K]) => any) {
			let arr = events.get(event) ?? []
			let entry = { id: Internals.gen_id(), callback } as ListenerEntry
			events.set(event, [...arr, entry])
			return entry.id
		}
		/**
		 * Removes an event listener
		 * @param event Event name
		 * @param id Listener ID
		 * @returns Whether the listener was removed
		 */
		export function remove(event: keyof TypeMap, id: string) {
			let arr = events.get(event)
			if (!arr) return false
			arr = arr.splice(arr.findIndex((entry) => entry.id === id))
			events.set(event, arr)
			return true
		}
		/**
		 * Triggers an event
		 * @param event Event name
		 * @param payload Event payload
		 */
		export function trigger<K extends keyof TypeMap>(event: K, payload: TypeMap[K]) {
			if (!events.has(event)) return
			events.get(event).forEach((entry) => entry.callback(payload))
		}
	}
	/** Program internals */
	export namespace Internals {
		/** Unique identifier generated using `Internals.gen_id()` */
		export type UniqueIdentifier = `${number}-${number}-${number}-${number}`

		/** Interface that allows for queueing */
		export interface Queueable {
			remove(): void
		}

		/** Defines a queue object */
		export class Queue<C extends Queueable> {
			/** Contents of the queue */
			private contents: Map<UniqueIdentifier, C> = new Map()

			/**
			 * Adds an item to the queue
			 * @param entry Item to add
			 * @param id ID of the item
			 * @returns Item ID
			 */
			public request(entry: C, id?: UniqueIdentifier) {
				id ??= Internals.gen_id()
				this.contents.set(id, entry)
				return id
			}
			/**
			 * Removes an item from the queue
			 * @param id ID of the item
			 * @returns Whether the item was removed
			 */
			public remove(id: UniqueIdentifier) {
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

		/** Stores frame information */
		export let frame = {
			/** Current frame number */
			current: 0,
			/** Timestamp of last frame */
			last: 0,
			/** ID of current frame */
			id: 0,
		}
		/** Stores framerate information */
		export let fps = {
			/** Temporary interval between frames */
			dynamic: [] as number[],
			/** Overall interval between frames */
			overall: [] as number[],
		}

		/** Generates a unique ID using four unsigned integers and the `crypto` api */
		export function gen_id() {
			let nums = crypto.getRandomValues(new Uint16Array(4))
			let strs = Array.from(nums).map((n) => `${n}`.padStart(5, "0"))
			return strs.join("-") as UniqueIdentifier
		}
		/**
		 * Waits for the given amount of time
		 * @param ms Milliseconds to wait
		 *
		 * Make sure you `await` the output (i.e. `await sleep(50)`)
		 */
		export function sleep(ms: number) {
			return new Promise((res) => setTimeout(res, ms))
		}
		/**
		 * Plays a sound
		 * @param src Sound source
		 */
		export async function play_sound(src: string, volume = 100) {
			console.time("sound")
			console.timeLog("sound", "queued")
			let elem = document.createElement("audio")
			elem.src = src
			elem.volume = volume
			elem.addEventListener("ended", () => document.removeChild(this))
			console.timeLog("sound", "playing")
			await elem.play()
			console.timeEnd("sound")
		}
		/**
		 * Throws an error
		 * @param source Error source
		 * @param name Type of error
		 * @param reason Reason for error
		 * @param stack Stacktrace of error
		 */
		export function error(source: string, name: string, reason: string, stack?: string) {
			let err = new Error()
			;(err.name = name), (err.message = reason), (err.stack = stack)

			Event.trigger("error", {
				name: "error",
				payload: { name, reason, stack },
				source,
				timestamp: performance.now(),
			})

			throw err
		}
	}
	/** Engine internals */
	export namespace Engine {
		/** Interface that allows for engine processing */
		export interface Updatable extends Internals.Queueable {
			/**
			 * Updates the instance
			 * @param delta Time since last frame
			 */
			update(delta: number): Promise<void>
		}

		/** Engine update queue */
		export const queue = new Internals.Queue<Updatable>()

		/**
		 * Updates all items in the queue
		 * @param delta Time since last frame
		 */
		export async function update(delta: number) {
			queue.array().forEach(async (item) => await item.update(delta))

			Event.trigger("update", {
				name: "update",
				payload: { frame: Internals.frame, delta },
				source: "Luna.Engine.update",
				timestamp: performance.now(),
			})
		}
	}
	/** Display internals */
	export namespace Display {
		/** Interface that allows for display rendering */
		export interface Renderable extends Internals.Queueable {
			/**
			 * Renders the instance
			 * @param delta Time since last frame
			 * @param ctx Rendering context
			 */
			render(delta: number, ctx: CanvasRenderingContext2D): Promise<void>
		}

		/** Display render queue */
		export const queue = new Internals.Queue<Renderable>()

		let canvas = document.querySelector("canvas")
		let ctx = canvas.getContext("2d")

		/** Initializes the display */
		export function init() {
			if (!canvas) Internals.error("Luna.Display.init", "Unable to initialize", "Missing canvas element")
			if (!ctx) Internals.error("Luna.Display.init", "Unable to initialize", "Missing image rendering context")
			ctx.imageSmoothingEnabled = false
		}
		/** Resizes the canvas to fit the screen */
		export function autofit() {
			let { clientWidth: w, clientHeight: h } = document.documentElement
			canvas.setAttribute("width", `${w}px`)
			canvas.setAttribute("height", `${h}px`)
		}
		/**
		 * Renders all items in the queue
		 * @param delta Time since last frame
		 */
		export async function render(delta: number) {
			let { clientWidth: dw, clientHeight: dh } = document?.documentElement
			let { width: cw, height: ch } = canvas
			if (cw !== dw || ch !== dh) autofit()

			ctx.beginPath()
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			queue.array().forEach(async (item) => item.render(delta, ctx))
			ctx.closePath()

			Event.trigger("render", {
				name: "render",
				payload: { canvas, ctx, delta, frame: Internals.frame },
				source: "Luna.Display.render",
				timestamp: performance.now(),
			})
		}
	}
	export namespace Sound {
		export type Category = "general" | "effect" | "music"

		export interface Playable extends Internals.Queueable {
			element: HTMLAudioElement
			category: Category
		}

		export const queue = new Internals.Queue<Playable>()

		export async function load(type: Category, src: string, volume: number) {
			let elem = document.createElement("audio")
			elem.src = src
			elem.volume = volume
			elem.load()

			let id = queue.request({
				category: type,
				element: elem,
				remove: () => {},
			})
		}
	}
	/** Engine classes */
	export namespace Class {
		/** @class Vector2D */
		export class Vector2D {
			/** A (1, 1) vector */
			public static readonly unit = new Vector2D(1, 1)
			/** A (0, 0) vector */
			public static readonly zero = new Vector2D(0, 0)

			/**
			 * Creates a new 2d vector
			 * @param x X value
			 * @param y Y value
			 */
			constructor(public x = 0, public y = 0) {}

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
		/** @class Vector3D */
		export class Vector3D implements Vector2D {
			/** A (1, 1, 1) vector */
			public static readonly unit = new Vector3D(1, 1, 1)
			/** A (0, 0, 0) vector */
			public static readonly zero = new Vector3D(0, 0, 0)

			/**
			 * Creates a new 3d vector
			 * @param x X value
			 * @param y Y value
			 * @param z Z value
			 */
			constructor(public x = 0, public y = 0, public z = 0) {}

			/** Creates a copy of the vector instance */
			public copy() {
				return new Vector3D(this.x, this.y, this.z)
			}
			/** Multiplies both values by -1 */
			public inverse() {
				return new Vector3D(-this.x, -this.y, -this.z)
			}
			/** Sets both values to their reciprocal */
			public reciprocal() {
				return new Vector3D(1 / this.x, 1 / this.y, 1 / this.z)
			}
			/** Returns a string representation of the instance */
			public to_string() {
				return JSON.stringify(this, null, "\t")
			}
			/** Converts the instance to a 2D vector */
			public to_2d() {
				return new Vector2D(this.x, this.y)
			}

			/** Sets the values of the instance */
			public set(x = this.x, y = this.y, z = this.z) {
				this.x = x
				this.y = y
				this.z = z
				return this
			}
			/** Adds to the values of the instance */
			public add(x = 0, y = 0, z = 0) {
				this.x += x
				this.y += y
				this.z += z
				return this
			}
			/** Subtracts from the values of the instance */
			public sub(x = 0, y = 0, z = 0) {
				this.x -= x
				this.y -= y
				this.z -= z
				return this
			}
			/** Multiplies the values of the instance */
			public mul(x = 1, y = 1, z = 1) {
				this.x *= x
				this.y *= y
				this.z *= z
				return this
			}
			/** Divides the values of the instance */
			public div(x = 1, y = 1, z = 1) {
				this.x /= x
				this.y /= y
				this.z /= z
				return this
			}
			/** Raises the values of the instance to a power */
			public pow(x = 1, y = 1, z = 1) {
				this.x **= x
				this.y **= y
				this.z **= z
				return this
			}
			/** Divides the values of the instance and sets them to the remainder */
			public mod(x = 1, y = 1, z = 1) {
				this.x %= x
				this.y %= y
				this.z %= z
				return this
			}
		}
		export abstract class Entity {
			public id: Internals.UniqueIdentifier
			public position: Vector2D
			public size: Vector3D
		}
		export class StaticEntity implements Entity, Engine.Updatable, Display.Renderable {
			public id = Internals.gen_id()

			constructor(public position: Vector2D, public size: Vector3D) {}

			public async update(delta: number) {}
			public async render(delta: number) {}
			public remove() {}
		}
		export class KineticEntity implements Entity, Engine.Updatable, Display.Renderable {
			public id = Internals.gen_id()

			constructor(public position: Vector2D, public size: Vector3D) {}

			public async update(delta: number) {}
			public async render(delta: number) {}
			public remove() {}
		}
	}

	/** Requests a new frame */
	export async function request_process_tick() {
		if (!running) return
		if (settings.vsync) {
			Internals.frame.id = requestAnimationFrame(process)
		} else {
			// this 0ms delay acts as a buffer to stop the thread from halting
			await new Promise((res) => setTimeout(res, 0))
			process(performance.now())
		}
	}
	/**
	 * Adds a frame interval to the fps arrays
	 * @param interval Delay between frames
	 */
	export function add_interval(interval: number) {
		Internals.fps.overall.push(interval)
		if (!settings.logfps) return
		Internals.fps.dynamic.push(interval)
	}
	/**
	 * Prints fps data to the console
	 * @param type Type of fps log
	 */
	export function print_frames(type: keyof typeof Internals.fps = "dynamic") {
		let arr = Internals.fps[type]
		if (arr.length === 0) return
		let sum = arr.reduce((p, c) => p + c)
		let avg = sum / arr.length
		console.log(`${+(1000 / avg).toFixed(3)}fps`, `${+avg.toFixed(3)}ms`)
	}
	/** Starts the engine process */
	export function start() {
		running = true
		request_process_tick()

		Event.trigger("start", {
			name: "start",
			payload: { frame: Internals.frame },
			source: "Luna.start",
			timestamp: performance.now(),
		})
	}
	/**
	 * Stops the engine process
	 * @param code Stop code
	 */
	export function stop(code = 0) {
		running = false
		if (settings.vsync) cancelAnimationFrame(Internals.frame.id)
		print_frames("overall")

		Event.trigger("stop", {
			name: "stop",
			payload: { code, frame: Internals.frame, fps: Internals.fps },
			source: "Luna.stop",
			timestamp: performance.now(),
		})

		Engine.queue.clear()
		Display.queue.clear()
		Internals.fps = { dynamic: [], overall: [] }
		Internals.frame = { current: 0, last: 0, id: 0 }
	}
	/**
	 * Processes a frame
	 * @param timestamp Current time
	 */
	export async function process(timestamp: number) {
		if (!running) return
		let delta = timestamp - Internals.frame.last

		if (settings.logfps) {
			if (Internals.frame.last !== 0) add_interval(delta)
			if (Internals.fps.dynamic.length >= settings.loginterval) {
				print_frames()
				Internals.fps.dynamic = []
			}
		}

		Internals.frame.last = timestamp
		Internals.frame.current++

		await Engine.update(delta)
		await Display.render(delta)

		if (dev.enabled && Internals.frame.current >= dev.runtime) stop(-1)
		else await request_process_tick()
	}
}
