/* eslint-disable @typescript-eslint/no-namespace */
/** Luna engine */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Luna {
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
	/** Defines hit information */
	export interface HitInformation {
		hit: boolean
		top: boolean
		left: boolean
		right: boolean
		bottom: boolean
		object?: Class.GameObject
	}

	/** Utilities */
	export namespace Util {
		/** Unique identifier */
		export type UID = `${number}-${number}-${number}-${number}`
		/** Defines an array with a fixed size using some TypeScript wizardry */
		export type FixedArray<N extends number, T> = N extends 0 ? never[] : { 0: T; length: N } & ReadonlyArray<T>

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

			Process.stop(1)
			throw err
		}
	}
	/** Classes */
	export namespace Class {
		/** Maps all component types to their classes */
		export interface ComponentMap {
			Transform: TransformComponent
			HitField: HitFieldComponent
			Texture: TextureComponent
			Animation: AnimationComponent
			Sound: SoundComponent
		}
		/** List of all valid hit field types */
		export enum HitField {
			Circle,
			Rectangle,
		}

		/** Luna engine base class */
		export abstract class LunaClass {
			/** Unique object identifier */
			public readonly uid = Util.genUID()

			/** Returns a string representation of the instance */
			public toString() {
				return JSON.stringify(this, null, "\t")
			}
		}
		/** Queue class */
		export class Queue<C> extends LunaClass {
			/** Contents of the queue */
			private __list: Map<Util.UID, C> = new Map()

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
			 * Adds or overwrites an item
			 * @param item Item to add
			 * @param id Item ID, if overwriting
			 * @returns Item ID
			 */
			public request(item: C, uid = item instanceof LunaClass ? item.uid : Util.genUID()) {
				this.__list.set(uid, item)
				return uid
			}
			/**
			 * Removes an item from the queue
			 * @param id Item ID
			 * @returns Whether the item could be removed
			 */
			public remove(uid: Util.UID) {
				return this.__list.delete(uid)
			}
			/** Clears the queue */
			public clear() {
				this.__list.clear()
			}
			/**
			 * Checks for the given ID within the queue
			 * @param id Item ID
			 */
			public hasUID(uid: Util.UID) {
				return this.__list.has(uid)
			}
			/**
			 * Fetches the ID of an item from the queue
			 * @param item Item
			 */
			public getUID(item: C) {
				const index = this.array().indexOf(item)
				return Array.from(this.__list.keys())[index]
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
				return Array.from(this.__list.values())
			}
			/**
			 * Runs the callback function once for each item in the queue
			 * @param callback Callback function
			 */
			public forEach(callback: (entry: C, uid: Util.UID) => unknown) {
				this.__list.forEach(callback)
			}
		}
		/** Interval class */
		export class Interval extends LunaClass {
			/** Whether the iterator met the target value */
			public active = false
			/** Current value */
			private __current = 0

			/**
			 * Creates a new interval
			 * @param target Target number
			 */
			public constructor(public target: number) {
				super()
			}

			/**
			 * Updates the interval
			 * @param val Value to add
			 */
			public update(val: number) {
				this.__current += val
				if (this.active) this.active = false
				if (this.__current >= this.target) this.active = true
				while (this.__current >= this.target) this.__current -= this.target
			}
		}
		/** Vector class */
		export class Vector<D extends number> extends LunaClass {
			/** Values of the vector */
			protected _values: number[]

			/** Creates a new vector */
			public constructor(...values: Util.FixedArray<D, number>) {
				super()
				this._values = Array.from(values)
			}

			/** A vector containing only zeroes */
			public static zero(dimensions: number) {
				return new Vector<typeof dimensions>(0)
			}
			/** A vector containing only ones */
			public static unit(dimensions: number) {
				const vec = new Vector<typeof dimensions>(1)
				vec._values.map(() => 1)
				return vec
			}
			/** Calculates the distance between two vectors */
			public static distance<D extends number>(vecA: Vector<D>, vecB: Vector<D>) {
				const temp = vecB
					.copy()
					.subtract(...vecA.values)
					.power(2)
				return Math.sqrt(temp.values.reduce((p, c) => p + c))
			}

			/** Number of vector dimensions */
			public get dimensions() {
				return this._values.length ?? 0
			}
			/** Values of the vector */
			public get values() {
				return Array.from(this._values)
			}
			/** Values of the vector */
			public set values(value: number[]) {
				const arr = value.slice(0, this.dimensions)
				while (arr.length < this.dimensions) arr.push(0)
				this._values = arr
			}
			/** Magnitude of the vector */
			public get magnitude() {
				const n = this.copy().power(2).values
				return Math.sqrt(n.reduce((p, c) => p + c))
			}
			/** Normal of the vector */
			public get normal() {
				const m = this.magnitude
				if (m === 0) return this
				else {
					const temp = this.copy()
					temp._values.map((n) => n / m)
					return temp
				}
			}

			/** Converts the vector to a new vector of the given size */
			public cast(dimensions: number) {
				return new Vector<typeof dimensions>(...(this._values as Util.FixedArray<D, number>))
			}
			/** Adds the given numbers to the vector; excess values are discarded */
			public add(...values: number[]) {
				this._values = this._values.map((n, i) => (n += values[i] ?? 0))
				return this
			}
			/** Subtracts the given numbers to the vector; excess values are discarded */
			public subtract(...values: number[]) {
				return this.add(...values.map((n) => -n))
			}
			/** Multiplies the values of the vector by the given numbers; excess values are discarded */
			public multiply(...values: number[]) {
				this._values = this._values.map((n, i) => (n *= values[i] ?? 1))
				return this
			}
			/** Divides the values of the vector by the given numbers; excess value are discarded */
			public divide(...values: number[]) {
				return this.multiply(...values.map((n) => 1 / n))
			}
			/** Raises the values of the vector to the given power */
			public power(power: number) {
				this._values = this._values.map((n) => n ** power)
				return this
			}
			/** Determines the nth root of the vector's values */
			public root(root: number) {
				return this.power(1 / root)
			}
			/** Checks whether the vector's values match the input */
			public matches(...values: Util.FixedArray<D, number>) {
				return this._values.every((n, i) => n === values[i])
			}
			/** Checks whether the given vector is equivalent to the vector instance */
			public equals(vector: Vector<D>) {
				return this.matches(...(vector._values as Util.FixedArray<D, number>))
			}
			/** Creates a copy of the instance */
			public copy() {
				return new Vector<D>(...(this._values as Util.FixedArray<D, number>))
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
			private __rotation: number

			/**
			 * Creates a new rotation instance
			 * @param value Rotation in degrees
			 */
			public constructor(value = 0) {
				this.__rotation = value
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
			public static rotatePoint(point: Vector<2>, origin: Vector<2>, angle: number) {
				const offsetX = point.values[0] - origin.values[0]
				const offsetY = point.values[1] - origin.values[1]
				const pointX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle) + origin.values[0]
				const pointY = offsetX * Math.sin(angle) - offsetY * Math.cos(angle) + origin.values[1]
				return new Vector(pointX, pointY)
			}

			/** Value of the rotation in degrees */
			public get degrees() {
				return this.__rotation
			}
			/** Value of the rotation in degrees */
			public set degrees(val: number) {
				while (val >= Rotation.maxDeg) val -= Rotation.maxDeg
				while (val < Rotation.minDeg) val += Rotation.maxDeg
				this.__rotation = val
			}
			/** Value of the rotation in radians */
			public get radians() {
				return Rotation.toRadians(this.__rotation)
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
		export abstract class Component extends LunaClass implements Updatable, Renderable {
			/** Type of component */
			public static readonly type: keyof ComponentMap

			/** Required components */
			protected readonly _required: (keyof ComponentMap)[] = []

			/**
			 * Creates a component
			 * @param _parent Parent game object
			 */
			public constructor(protected _parent: GameObject) {
				super()
				for (const component of this._required) {
					if (!_parent.hasComponent(component)) Util.error("Missing required component", `Parent object must contain '${component}'`)
				}
			}

			/** Type of component */
			public get type() {
				return Component.type
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async update(delta: number) {
				/* */
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			public async render(delta: number) {
				/* */
			}
			/** Checks whether the given game object is the component's parent */
			public isChildOf(parent: GameObject) {
				return this._parent === parent
			}
			/** Creates a copy of the component */
			public copy(parent = this._parent): Component {
				this._parent = parent
				return this
			}
		}
		/** Transform component */
		export class TransformComponent extends Component {
			public static readonly type: keyof ComponentMap = "Transform"

			/**
			 * Creates a new transform component
			 * @param parent Parent game object
			 * @param position The component's position property
			 * @param rotation The component's rotation property
			 */
			public constructor(parent: GameObject, public position: Vector<2>, public rotation: Rotation) {
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
			public static readonly type: keyof ComponentMap = "HitField"

			protected readonly _required: (keyof ComponentMap)[] = ["Transform"]

			/**
			 * Creates a new hit field component
			 * @param parent Parent game object
			 */
			public constructor(parent: GameObject) {
				super(parent)
			}

			/**
			 * Checks for a collision between two rectangular fields
			 * @param fieldA First field
			 * @param fieldB Second field
			 */
			protected static collideBB(fieldA: RectangleHitFieldComponent, fieldB: RectangleHitFieldComponent) {
				const { [0]: widthA, [1]: heightA } = fieldA.size.copy().divide(2, 2).values
				const { [0]: xPosA, [1]: yPosA } = fieldA._position.values
				const { [0]: widthB, [1]: heightB } = fieldB.size.copy().divide(2, 2).values
				const { [0]: xPosB, [1]: yPosB } = fieldB._position.values

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
				const hit = Vector.distance(positionA, positionB) <= fieldA.radius + fieldB.radius
				return { hit, object: hit ? fieldB._parent : undefined } as HitInformation
			}
			/**
			 * Checks for a collision between a rectangular and circular field
			 * @param fieldA Rectangular field
			 * @param fieldB Circular field
			 */
			protected static collideBBToBC(fieldA: RectangleHitFieldComponent, fieldB: CircleHitFieldComponent) {
				const { [0]: width, [1]: height } = fieldA.size.values
				const { [0]: xPosA, [1]: yPosA } = fieldA._position.values
				const { [0]: xPosB, [1]: yPosB } = fieldB._position.values
				const x = Math.max(xPosA, Math.min(xPosB, xPosA + width))
				const y = Math.max(yPosA, Math.min(yPosB, yPosA + height))
				const hit = Vector.distance(new Vector(x, y), new Vector(xPosB, yPosB)) < fieldB.radius

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
			public constructor(parent: GameObject, public size: Vector<2>) {
				super(parent)
			}

			public get fieldType() {
				return "Rectangle" as keyof HitField
			}
		}
		/** Texture component */
		export class TextureComponent extends Component {
			public static readonly type: keyof ComponentMap = "Texture"

			protected readonly _required: (keyof ComponentMap)[] = ["Transform"]

			/** Texture image */
			protected _image: HTMLImageElement
			/** Render size */
			protected _renderSize: Vector<2>

			/**
			 * Creates a new texture component
			 * @param parent Parent game object
			 * @param _source Image source
			 * @param _size Image size
			 */
			public constructor(parent: GameObject, protected _source: string, protected _size: Vector<2>) {
				super(parent)
				this._size.values = this._size.values.map((n) => Math.floor(n))
				this._image = new Image(this._size.values[0], this._size.values[1])
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
			public set size(value: Vector<2>) {
				this._renderSize.values = value.values.map((n) => Math.floor(n))
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
				if (this._renderSize.values[0] === 0 || this._renderSize.values[1] === 0) return
				if (this._image.width === 0 || this._image.height === 0) return
				if (Camera.active?.shouldCull(new RectangleHitFieldComponent(this._parent, this._renderSize))) return

				try {
					Process.context?.drawImage(this._image, this._position.values[0], this._position.values[1], this._renderSize.values[0], this._renderSize.values[1])
				} catch {
					Util.error("Unable to render asset", "Image could not be rendered")
				}
			}
		}
		/** Animation component */
		export class AnimationComponent extends TextureComponent {
			public static readonly type: keyof ComponentMap = "Animation"

			/** Size of one frame */
			protected _frameSize: Vector<2>
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
			public constructor(parent: GameObject, source: string, size: Vector<2>, protected _frameCount: number) {
				super(parent, source, size)
				this._frameSize = size.copy().divide(1, _frameCount)
				this._frameSize.values = this._frameSize.values.map((n) => Math.floor(n))
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

				if (this._renderSize.values[0] === 0 || this._renderSize.values[1] === 0) return
				if (this._frameSize.values[0] === 0 || this._frameSize.values[1] === 0) return
				if (Camera.active?.shouldCull(new RectangleHitFieldComponent(this._parent, this._renderSize))) return

				Process.context?.drawImage(
					this._image,
					this._frameSize.values[0] * this._currentFrame,
					0,
					this._frameSize.values[0],
					this._frameSize.values[1],
					this._position.values[0],
					this._position.values[1],
					this._renderSize.values[0],
					this._renderSize.values[1]
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
		/** Sound component */
		export class SoundComponent extends Component {
			public static readonly type: keyof ComponentMap = "Sound"
			/** Loaded and registered sounds */
			protected _soundQueue: Map<string, HTMLAudioElement> = new Map()

			/**
			 * Creates a new sound component
			 * @param parent Parent game object
			 */
			public constructor(parent: GameObject) {
				super(parent)
			}

			public get type() {
				return SoundComponent.type
			}

			/** @param parent Parent game object */
			public copy(parent = this._parent) {
				return new SoundComponent(parent)
			}
			/**
			 * Loads an audio resource
			 * @param id Audio identifier, should be unique
			 * @param source Audio source, path to the sound file
			 * @param overwrite Whether to overwrite an entry if present
			 */
			public load(id: string, source: string, overwrite = false) {
				if (this._soundQueue.has(id) && !overwrite) return

				const elem = document.createElement("audio")
				elem.src = source
				elem.load()

				this._soundQueue.set(id, elem)
				return id
			}
			/** Plays a sound with the given identifier */
			public async play(id: string) {
				if (!this._soundQueue.has(id)) return
				else await this._soundQueue.get(id).play()
			}
			/** Unloads a sound entry (and removes it from the map) */
			public unload(id: string) {
				return this._soundQueue.delete(id)
			}
			/** Unloads and clears the sound map */
			public unloadAll() {
				this._soundQueue.clear()
			}
		}

		/** Game object class */
		export class GameObject extends LunaClass implements Updatable, Renderable {
			/** Game object components */
			private __components: Map<Util.UID, Component>

			/**
			 * Creates a new game object
			 * @param components Components to add
			 */
			public constructor(...components: Component[]) {
				super()
				this.__components = new Map()
				components.forEach(this.addComponent)
			}

			public async update(delta: number) {
				this.__components.forEach(async (component) => await component.update(delta))
			}
			public async render(delta: number) {
				this.__components.forEach(async (component) => await component.render(delta))
			}
			/** Checks for a component */
			public hasComponent(type: keyof ComponentMap) {
				return Array.from(this.__components.values()).some((component) => component.type === type)
			}
			/** Fetches a component; if a uid is not provided returns the first instance of the requested component */
			public getComponent<T extends keyof ComponentMap>(type: T, uid?: Util.UID) {
				if (uid) return this.__components.get(uid) as ComponentMap[T]
				else return Array.from(this.__components.values()).find((component) => component.type === type) as ComponentMap[T]
			}
			/** Adds a component to the game object */
			public addComponent<T extends keyof ComponentMap>(component: ComponentMap[T]) {
				const temp = !component.isChildOf(this) ? component.copy(this) : component
				this.__components.set(temp.uid, temp)
				return temp.uid
			}
			/** Creates a copy of the game object */
			public copy() {
				return new GameObject(...this.__components.values())
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

			public readonly uid = Util.genUID()
			/** Camera offset */
			protected _offset = Vector.zero(2)
			/** Camera zoom */
			protected _zoom = Vector.unit(2)

			/**
			 * Creates a new camera
			 * @param position Camera root position
			 * @param offset Camera position offset
			 */
			public constructor(position: Vector<2>, rotation: Rotation) {
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
			/** Resizes the camera view */
			public resize(vector: Vector<2>) {
				// eslint-disable-next-line @typescript-eslint/no-extra-semi
				;(this.getComponent("HitField") as RectangleHitFieldComponent).size = vector
			}
			/** Sets the camera's zoom */
			public zoom(x = 1, y = 1) {
				this._zoom.multiply(x, y)
			}
			/** Sets the camera's position */
			public focusTo(x = this._transform.position.values[0], y = this._transform.position.values[1]) {
				this._offset.values = [x, y]
			}
			/** Rotates the camera */
			public rotate(degrees = 0) {
				this._transform.rotation.degrees += degrees
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
		export const updateQueue = new Class.Queue<Updatable>()
		/** Queue of items to be rendered */
		export const renderQueue = new Class.Queue<Renderable>()

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
			autoResize()
			Class.Camera.active = new Class.Camera(new Class.Vector(0, 0), new Class.Rotation(0))
			renderQueue.request(Class.Camera.active)
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
		/** Automatically resize the canvas */
		export function autoResize() {
			const { clientWidth: docWidth, clientHeight: docHeight } = document.documentElement

			if (canvas.width === docWidth && canvas.height === docHeight) return

			canvas.setAttribute("width", `${docWidth}px`)
			canvas.setAttribute("height", `${docHeight}px`)

			Class.Camera.active?.resize(new Class.Vector(docWidth, docHeight))
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
			autoResize()

			// calculates the time that has passed since the last frame
			const delta = time - frame.last
			frame.last = time
			frame.current++

			updateQueue.forEach(async (entry) => await entry.update(delta))

			context.beginPath()
			context.clearRect(0, 0, canvas.width, canvas.height)
			renderQueue.forEach(async (entry) => await entry.render(delta))
			context.closePath()

			Event.dispatch("frame", { delta, frame: frame.current })
			await callFrame()
		}
	}
}
