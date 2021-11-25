/* eslint-disable @typescript-eslint/no-namespace */
/** Luna engine */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Luna {
	/** Utilities */
	export namespace Util {
		/** Unique identifier */
		export type UID = `${number}-${number}-${number}-${number}`

		/** Generates a new unique identifier using `crypto` */
		export function genUID(): UID {
			const numbers = crypto.getRandomValues(new Uint16Array(4))
			const strings = Array.from(numbers).map((n) => `${n}`.padStart(5, "0"))

			return strings.join("-") as UID
		}
		/**
		 * Sets a timer for the given time
		 * @param ms Time to wait in milliseconds
		 * @returns Timer
		 */
		export function sleep(ms = 0) {
			return new Promise((r) => setTimeout(r, ms))
		}
		/**
		 * Throws an error
		 * @param name Error name
		 * @param reason Error reason
		 * @param trace Error stacktrace
		 * @param source Caller source
		 */
		export function error(name: string, reason: string, trace?: string, source = "Luna") {
			const err = new Error()
			err.name = name
			err.message = reason
			err.stack = trace

			Event.dispatch("error", { name, reason, source, trace })

			throw err
		}
	}
	/** Classes */
	export namespace Class {
		/** Defines a class with a unique identifier */
		export interface Unique {
			/** Unique identifier */
			readonly uid: Util.UID
		}
		/** Defines a class that can be updated */
		export interface Updatable {
			/**
			 * Updates the object
			 * @param delta Time since last frame
			 */
			update(delta: number): Promise<unknown>
		}
		/** Defines a class that can be rendered */
		export interface Renderable {
			/**
			 * Renders the object
			 * @param delta Time since last frame
			 */
			render(delta: number): Promise<unknown>
		}

		/** Maps all component types to their classes */
		export interface TypeMap {
			Transform: TransformComponent
			HitField: HitFieldComponent
			Texture: TextureComponent
			Animation: AnimationComponent
		}
		/** Map of hit field types and their properties */
		export interface HitField {
			Circle: [number]
			Rectangle: [Vector]
		}
		/** Defines hit information */
		export interface HitInformation {
			hit: boolean
			top: boolean
			left: boolean
			right: boolean
			bottom: boolean
			object?: GameObject
		}

		/** Queue class */
		export class Queue<C> {
			/** Contents of the queue */
			private list: Map<Util.UID, C> = new Map()

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
			public request(item: C, uid = Util.genUID()) {
				this.list.set(uid, item)
				return uid
			}
			/**
			 * Removes an item from the queue
			 * @param id Item ID
			 * @returns Whether the item could be removed
			 */
			public remove(uid: Util.UID) {
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
			public hasUID(uid: Util.UID) {
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
			public forEach(callback: (entry: C, uid: Util.UID) => unknown) {
				this.list.forEach(callback)
			}
			/** Converts the queue to a string */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}
		/** Interval class */
		export class Interval {
			/** Current value */
			public current = 0
			/** Whether the iterator met the target value */
			public active = false

			/**
			 * Creates a new interval
			 * @param target Target number
			 */
			constructor(public target: number) {}

			/**
			 * Updates the interval
			 * @param val Value to add
			 */
			public update(val: number) {
				this.current += val

				// reset activity
				if (this.active) this.active = false
				if (this.current >= this.target) this.active = true
				// keep current value below target value, prevents numbers from getting WAY too big
				while (this.current >= this.target) this.current -= this.target
			}
			/** Converts the interval to a string */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}
		/** Vector class */
		export class Vector {
			/**
			 * Creates a new vector
			 * @param x X value
			 * @param y Y value
			 */
			public constructor(public x = 0, public y = 0) {}

			/** A (0, 0) vector */
			public static get zero() {
				return new Vector(0, 0)
			}
			/** A (1, 1) vector */
			public static get unit() {
				return new Vector(1, 1)
			}

			/** Calculates the midpoint of the given vectors */
			public static midpoint(...values: Vector[]) {
				const accumulator = new Vector()
				values.forEach((vector) => accumulator.add(vector.x, vector.y))
				return accumulator.divide(values.length, values.length)
			}

			/** Creates a copy of the vector */
			public copy() {
				return new Vector(this.x, this.y)
			}
			/** Inverts the vector */
			public inverse() {
				this.x *= -1
				this.y *= -1
			}
			/** Sets both values to their reciprocal */
			public reciprocal() {
				this.x = 1 / this.x
				this.y = 1 / this.y
			}
			/** Finds the magnitude of the vector */
			public magnitude() {
				const { x, y } = this.copy().power(2, 2)
				return Math.sqrt(x + y)
			}
			/** Normalizes the vector */
			public normalize() {
				const magnitude = this.magnitude()
				if (magnitude === 0) return this
				return this.divide(magnitude, magnitude)
			}
			/** Calculates the distance to the given vector */
			public distanceTo(vec: Vector) {
				const temp = vec.copy().subtract(this.x, this.y).power(2, 2)
				return Math.sqrt(temp.x + temp.y)
			}
			/** Calculates the dot product with the given vector */
			public dotProduct(vec: Vector) {
				return this.x * vec.x + (this.y + vec.y)
			}
			/** Converts the vector to a string */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}

			/** Adds to the vector's values */
			public add(x = 0, y = 0) {
				this.x += x
				this.y += y
				return this
			}
			/** Subtracts from the vector's values */
			public subtract(x = 0, y = 0) {
				return this.add(-x, -y)
			}
			/** Multiplies the vector's values */
			public multiply(x = 1, y = 1) {
				this.x *= x
				this.y *= y
				return this
			}
			/** Divides the vector's values */
			public divide(x = 1, y = 1) {
				return this.multiply(1 / x, 1 / y)
			}
			/** Raises the vector's values to a power */
			public power(x = 1, y = 1) {
				this.x **= x
				this.y **= y
				return this
			}
			/** Finds the root of the vector's values */
			public root(x = 1, y = 1) {
				return this.power(1 / x, 1 / y)
			}
			/** Sets the vector's values */
			public set(x = this.x, y = this.y) {
				this.x = x
				this.y = y
				return this
			}
			/** Checks whether the vector's values match the input */
			public matches(x: number, y: number) {
				return this.x === x && this.y === y
			}
		}
		/** Rotation class */
		export class Rotation {
			/** Minimum rotation in degrees */
			public static readonly minDeg = 0
			/** Maximum rotation in degrees */
			public static readonly maxDeg = 360
			/** Minimum rotation in radians */
			public static readonly minRad = Rotation.toRadians(Rotation.minDeg)
			/** Maximum rotation in radians */
			public static readonly maxRad = Rotation.toRadians(Rotation.maxDeg)

			/** Object rotation, stored as degrees for better accuracy */
			private rotation: number

			/**
			 * Creates a new rotation instance
			 * @param value Rotation in degrees
			 */
			public constructor(value = 0) {
				this.rotation = value
			}

			/** Converts radians to degrees */
			public static toDegrees(value: number) {
				return (value * 180) / Math.PI
			}
			/** Converts degrees to radians */
			public static toRadians(value: number) {
				return (value * Math.PI) / 180
			}
			/**
			 * Rotates a vector around a given origin
			 * @param point Point to rotate
			 * @param origin Origin point
			 * @param angle Angle in radians
			 */
			public static rotatePoint(point: Vector, origin: Vector, angle: number) {
				const offsetX = point.x - origin.x
				const offsetY = point.y - origin.y
				const pointX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle) + origin.x
				const pointY = offsetX * Math.sin(angle) - offsetY * Math.cos(angle) + origin.y
				return new Vector(pointX, pointY)
			}

			/** Value of the rotation in degrees */
			public get degrees() {
				return this.rotation
			}
			/** Value of the rotation in degrees */
			public set degrees(val: number) {
				while (val >= Rotation.maxDeg) val -= Rotation.maxDeg
				while (val < Rotation.minDeg) val += Rotation.maxDeg
				this.rotation = val
			}
			/** Value of the rotation in radians */
			public get radians() {
				return Rotation.toRadians(this.rotation)
			}
			/** Value of the rotation in radians */
			public set radians(val: number) {
				this.degrees = Rotation.toDegrees(val)
			}

			/** Converts the rotation to a string */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}

		/** Basic component */
		export abstract class Component implements Unique {
			/** Type of component */
			public static readonly type: keyof TypeMap

			public readonly uid = Util.genUID()

			/** Required components */
			protected readonly _required: (keyof TypeMap)[] = []

			/**
			 * Creates a component
			 * @param _parent Parent game object
			 */
			public constructor(protected _parent: GameObject) {
				for (const component of this._required) {
					if (!_parent.hasComponent(component)) Util.error("Missing required component", `Parent object must contain '${component}'`)
				}
			}

			/** Type of component */
			public get type() {
				return Component.type
			}

			/** Creates a copy of the component */
			public copy(parent = this._parent): Component {
				this._parent = parent
				return this
			}
			/** Returns a string representation of the component */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}
		/** Transform component */
		export class TransformComponent extends Component {
			public static readonly type: keyof TypeMap = "Transform"

			/**
			 * Creates a new transform component
			 * @param parent Parent game object
			 * @param position The component's position property
			 * @param rotation The component's rotation property
			 */
			public constructor(parent: GameObject, public position: Vector, public rotation: Rotation) {
				super(parent)
			}

			public get type() {
				return TransformComponent.type
			}

			/** @param parent Parent game object */
			public copy(parent = this._parent) {
				return new TransformComponent(parent, this.position, this.rotation)
			}
		}
		/** Hit field component */
		export abstract class HitFieldComponent extends Component {
			public static readonly type: keyof TypeMap = "HitField"
			protected readonly _required: (keyof TypeMap)[] = ["Transform"]

			/**
			 * Creates a new hit field component
			 * @param parent Parent game object
			 */
			public constructor(parent: GameObject) {
				super(parent)
			}

			public get type() {
				return HitFieldComponent.type
			}
			/** Type of hit field */
			public get fieldType(): keyof HitField {
				return null
			}
			/** Component parent's position property */
			protected get _position() {
				return this._parent.getComponent("Transform").position
			}
			/** Component parent's rotation property */
			protected get _rotation() {
				return this._parent.getComponent("Transform").rotation
			}

			/**
			 * Checks for a collision with another field
			 * @param field Other hit field
			 */
			public checkCollision(field: HitFieldComponent): HitInformation {
				if (this instanceof CircleHitFieldComponent && field instanceof CircleHitFieldComponent) return HitFieldComponent.collideBC(this, field)
				if (this instanceof CircleHitFieldComponent && field instanceof RectangleHitFieldComponent) return HitFieldComponent.collideBCToBB(this, field)
				if (this instanceof RectangleHitFieldComponent && field instanceof CircleHitFieldComponent) return HitFieldComponent.collideBBToBC(this, field)
				if (this instanceof RectangleHitFieldComponent && field instanceof RectangleHitFieldComponent) return HitFieldComponent.collideBB(this, field)
				return null
			}
			/**
			 * Checks for a collision between two rectangular fields
			 * @param fieldA First field
			 * @param fieldB Second field
			 */
			protected static collideBB(fieldA: RectangleHitFieldComponent, fieldB: RectangleHitFieldComponent) {
				const { x: widthA, y: heightA } = fieldA.size
				const { x: xPosA, y: yPosA } = fieldA._position
				const { x: widthB, y: heightB } = fieldB.size
				const { x: xPosB, y: yPosB } = fieldB._position

				const x = xPosA <= xPosB + widthB && xPosA + widthA >= xPosB
				const y = yPosA <= yPosB + heightB && yPosB + heightA >= yPosB

				return {
					hit: x && y,
					left: x && xPosA < xPosB,
					right: x && xPosB < xPosA,
					bottom: y && yPosA < yPosB,
					top: y && yPosB < yPosA,
					object: x && y ? fieldB._parent : undefined,
				} as HitInformation
			}
			/**
			 * Checks for a collision between two circular fields
			 * @param fieldA First field
			 * @param fieldB Second field
			 */
			protected static collideBC(fieldA: CircleHitFieldComponent, fieldB: CircleHitFieldComponent) {
				const positionA = fieldA._position
				const positionB = fieldB._position
				const hit = positionA.distanceTo(positionB) <= fieldA.radius + fieldB.radius
				return { hit, object: hit ? fieldB._parent : undefined } as HitInformation
			}
			/**
			 * Checks for a collision between a rectangular and circular field
			 * @param fieldA Rectangular field
			 * @param fieldB Circular field
			 */
			protected static collideBBToBC(fieldA: RectangleHitFieldComponent, fieldB: CircleHitFieldComponent) {
				const { x: width, y: height } = fieldA.size
				const { x: xPosA, y: yPosA } = fieldA._position
				const { x: xPosB, y: yPosB } = fieldB._position
				const x = Math.max(xPosA, Math.min(xPosB, xPosA + width))
				const y = Math.max(yPosA, Math.min(yPosB, yPosA + height))
				const hit = new Vector(x, y).distanceTo(new Vector(xPosB, yPosB)) < fieldB.radius

				return {
					hit,
					left: hit && xPosB < xPosA,
					right: hit && xPosA < xPosB,
					top: hit && yPosB < yPosA,
					bottom: hit && yPosA < yPosB,
					object: hit ? fieldB._parent : undefined,
				} as HitInformation
			}
			/**
			 * Checks for a collision between a circular and rectangular field
			 * @param fieldA Circular field
			 * @param fieldB Rectangular field
			 */
			protected static collideBCToBB(fieldA: CircleHitFieldComponent, fieldB: RectangleHitFieldComponent) {
				const info = this.collideBBToBC(fieldB, fieldA)

				return {
					hit: info.hit,
					left: info.right,
					right: info.left,
					top: info.bottom,
					bottom: info.top,
					object: info.object,
				} as HitInformation
			}
		}
		/** Circular hit field component */
		export class CircleHitFieldComponent extends HitFieldComponent {
			/**
			 * Creates a new circular hit field component
			 * @param parent Parent game object
			 * @param radius Radius of the field
			 */
			public constructor(parent: GameObject, public radius: number) {
				super(parent)
			}

			public get fieldType() {
				return "Circle" as keyof HitField
			}
		}
		/** Rectangular hit field component */
		export class RectangleHitFieldComponent extends HitFieldComponent {
			/**
			 * Creates a new rectangular hit field component
			 * @param parent Parent game object
			 * @param size Size of the field
			 */
			public constructor(parent: GameObject, public size: Vector) {
				super(parent)
			}

			public get fieldType() {
				return "Rectangle" as keyof HitField
			}
		}
		/** Texture component */
		export class TextureComponent extends Component implements Renderable {
			public static readonly type: keyof TypeMap = "Texture"
			protected readonly _required: (keyof TypeMap)[] = ["Transform"]

			/** Texture image */
			protected _image: HTMLImageElement
			/** Render size */
			protected _renderSize: Vector

			/**
			 * Creates a new texture component
			 * @param parent Parent game object
			 * @param _source Image source
			 * @param _size Image size
			 */
			public constructor(parent: GameObject, protected _source: string, protected _size: Vector) {
				super(parent)
				this._image = new Image(this._size.x, this._size.y)
				this._image.src = this._source
				this._renderSize = this._size
			}

			public get type() {
				return TextureComponent.type
			}
			/** Image rendering size */
			public get size() {
				return this._renderSize.copy()
			}
			/** Image rendering size */
			public set size(value: Vector) {
				this._renderSize.set(value.x, value.y)
			}
			/** Component parent's position property */
			protected get _position() {
				return this._parent.getComponent("Transform").position
			}
			/** Component parent's rotation property */
			protected get _rotation() {
				return this._parent.getComponent("Transform").rotation
			}

			/** @param parent Parent game object */
			public copy(parent = this._parent) {
				return new TextureComponent(parent, this._source, this._size)
			}
			/** Resets the image's render size */
			public resetSize() {
				this._renderSize = this._size
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async render(delta: number) {
				if (this._renderSize.x === 0 || this._renderSize.y === 0) return
				if (this._image.width === 0 || this._image.height === 0) return
				if (Camera.active?.shouldCull(new RectangleHitFieldComponent(this._parent, this._renderSize))) return

				Process.context?.drawImage(this._image, this._position.x, this._position.y, this._renderSize.x, this._renderSize.y)
			}
		}
		export class AnimationComponent extends TextureComponent {
			public static readonly type: keyof TypeMap = "Animation"

			/** Size of one frame */
			protected _frameSize: Vector
			/** Determines when to change frame */
			protected _frameUpdate: Interval
			/** Current frame */
			protected _currentFrame = 0

			/**
			 * Creates a new animation component
			 * @param parent Parent game object
			 * @param source Image source
			 * @param size Image size
			 * @param frameCount Number of frames
			 */
			public constructor(parent: GameObject, source: string, size: Vector, protected _frameCount: number) {
				super(parent, source, size)
				this._frameSize = size.copy().divide(1, _frameCount)
				this._frameSize.x = Math.floor(this._frameSize.x)
				this._renderSize = this._frameSize
			}

			public get type() {
				return AnimationComponent.type
			}

			/** @param parent Parent game object */
			public copy(parent = this._parent) {
				return new AnimationComponent(parent, this._source, this._size, this._frameCount)
			}
			public resetSize() {
				this._renderSize = this._frameSize
			}
			public async render(delta: number) {
				this._updateFrame(delta)

				if (this._renderSize.x === 0 || this._renderSize.y === 0) return
				if (this._frameSize.x === 0 || this._frameSize.y === 0) return
				if (Camera.active?.shouldCull(new RectangleHitFieldComponent(this._parent, this._renderSize))) return

				Process.context?.drawImage(
					this._image,
					this._frameSize.x * this._currentFrame,
					0,
					this._frameSize.x,
					this._frameSize.y,
					this._position.x,
					this._position.y,
					this._renderSize.x,
					this._renderSize.y
				)
			}
			/** Checks for a frame change */
			protected _updateFrame(delta: number) {
				this._frameUpdate.update(delta)

				if (this._frameUpdate.active) {
					if (++this._currentFrame >= this._frameCount) this._currentFrame -= this._frameCount
				}
			}
		}

		/** Game object class */
		export class GameObject implements Unique {
			public readonly uid = Util.genUID()
			/** Game object components */
			private __components: Component[]

			/**
			 * Creates a new game object
			 * @param components Components to add
			 */
			public constructor(...components: Component[]) {
				this.__components = components.map((component) => component.copy(this))
			}

			/** Checks for a component */
			public hasComponent(type: keyof TypeMap) {
				return this.__components.some((component) => component.type === type)
			}
			/** Fetches a component */
			public getComponent<T extends keyof TypeMap>(type: T) {
				return this.__components.find((component) => component.type === type) as TypeMap[T]
			}
			/** Adds a component to the game object */
			public addComponent<T extends keyof TypeMap>(component: TypeMap[T]) {
				this.__components.push(component.copy(this))
			}
			/** Creates a copy of the game object */
			public copy() {
				return new GameObject(...this.__components)
			}
			/** Returns a string representation of the game object */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}
		/** Camera class */
		export class Camera extends GameObject {
			/** Active camera */
			public static active: Camera
			public uid = Util.genUID()

			/** Camera offset */
			protected _offset = Vector.zero

			/**
			 * Creates a new camera
			 * @param position Camera root position
			 * @param offset Camera position offset
			 */
			public constructor(position: Vector, rotation: Rotation) {
				super()
				this.addComponent(new TransformComponent(this, position, rotation))
				this.addComponent(new RectangleHitFieldComponent(this, new Vector(Process.canvas.width, Process.canvas.height)))
			}

			/** Camera transformation */
			protected get _transform() {
				return this.getComponent("Transform")
			}
			/** Camera hit field */
			protected get _hitField() {
				return this.getComponent("HitField")
			}

			/** Checks whether a body should be rendered */
			public shouldCull(field: HitFieldComponent) {
				return !this._hitField.checkCollision(field).hit
			}
		}
	}
	/** Event manager */
	export namespace Event {
		/** Defines event contents */
		export interface EventMap {
			start: { vsync: boolean }
			stop: { code: number; frame: number }
			frame: { delta: number; frame: number }
			error: { name: string; reason: string; source: string; trace?: string }
		}
		/** Creates a new event */
		export interface Constructor<E extends keyof EventMap> {
			contents: EventMap[E]
			name: E
			source: string
			time: number
		}
		/** Defines an event listener callback */
		export type Callback<E extends keyof EventMap> = (event: Constructor<E>) => unknown
		/** Defines an event callback queue */
		export type QueueType<E extends keyof EventMap> = Class.Queue<Callback<E>>

		/** Map of all events and their listeners */
		const events: Map<keyof EventMap, QueueType<keyof EventMap>> = new Map()

		/**
		 * Dispatches an event, calling all created event listeners
		 * @param name Event name
		 * @param contents Event payload
		 * @param source Caller source
		 */
		export function dispatch<E extends keyof EventMap>(name: E, contents: EventMap[E], source = "Luna") {
			// ensures event callbacks exist
			if (!events.has(name)) return
			const event = { contents, name, source, time: performance.now() } as Constructor<E>
			// all callbacks are given the same event object
			events.get(name).forEach((value) => value(event))
		}
		/**
		 * Adds an event listener
		 * @param name Event name
		 * @param callback Event callback
		 * @returns Unique identifier
		 */
		export function addListener<E extends keyof EventMap>(name: E, callback: Callback<E>) {
			// ensure event queue exists
			const queue = events.get(name) ?? new Class.Queue<Callback<keyof EventMap>>()
			const uid = queue.request(callback)
			events.set(name, queue)
			// return uid in case the listener is removed later
			return uid
		}
		/**
		 * Removes an event listener
		 * @param name Event name
		 * @param uid Unique identifier
		 * @returns Whether the listener was removed
		 */
		export function removeListener<E extends keyof EventMap>(name: E, uid: Util.UID) {
			let removed = false

			if (events.has(name)) {
				const queue = events.get(name)
				removed = queue.remove(uid)
				events.set(name, queue)
			}

			return removed
		}
	}
	/** Engine process */
	export namespace Process {
		/** Contains frame information */
		export const frame = { current: 0, id: 0, last: 0, vsync: false }
		/** Queue of items to be updated */
		export const updateQueue = new Class.Queue<Class.Updatable>()
		/** Queue of items to be rendered */
		export const renderQueue = new Class.Queue<Class.Renderable>()
		/** Canvas element */
		export let canvas: HTMLCanvasElement
		/** Rendering contenxt */
		export let context: CanvasRenderingContext2D
		/** Whether the engine is running */
		export let running = false

		/** Initializes the engine */
		export function init() {
			canvas = document.querySelector("canvas")
			context = canvas?.getContext("2d")
			if (!canvas) Util.error("Error initializing", "Unable to load canvas element")
			if (!context) Util.error("Error initializing", "Unable to fetch rendering context")
			Class.Camera.active = new Class.Camera(Class.Vector.zero, new Class.Rotation(0))

			start()
		}
		/** Resets internal variables */
		export function reset() {
			frame.current = 0
			frame.id = 0
			frame.last = 0
			frame.vsync = false
			running = false
		}
		/** Requests a new frame */
		export async function callFrame() {
			if (!running) return
			if (frame.vsync) frame.id = requestAnimationFrame(run)
			else {
				// stops thread from halting
				await Util.sleep()
				run(performance.now())
			}
		}
		/** Begins the engine process */
		export function start() {
			running = true
			Event.dispatch("start", { vsync: frame.vsync })
			callFrame()
		}
		/**
		 * Ends the engine process
		 * @param code Stop code
		 */
		export function stop(code = 0) {
			if (frame.vsync) cancelAnimationFrame(frame.id)
			Event.dispatch("stop", { code, frame: frame.current })
			reset()
		}
		/**
		 * Processes a frame
		 * @param time Current time
		 */
		export async function run(time: number) {
			// stops frames from being processed if the engine is considered stopped
			if (!running) return

			// calculates the time that has passed since the last frame
			const delta = time - frame.last
			frame.last = time
			frame.current++

			updateQueue.forEach(async (entry) => await entry.update(delta))

			context.beginPath()
			renderQueue.forEach(async (entry) => await entry.render(delta))
			context.closePath()

			Event.dispatch("frame", { delta, frame: frame.current })
			await callFrame()
		}
	}
}
