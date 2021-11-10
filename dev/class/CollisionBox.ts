/**
 * @class Collision box
 * @property Size
 */
class CollisionBox {
	// properties
	private _parent: Entity
	private _size: Vector

	// constructor
	/**
	 * @constructor Creates a new collision box
	 * @param width Width of the box
	 * @param height Height of the box
	 */
	constructor(parent: Entity, width: number, height: number) {
		this._parent = parent
		this._size = new Vector(width, height)
	}

	// getters / setters
	/** The width of the box */
	public get width() {
		return this._size.x
	}
	/** The height of the box */
	public get height() {
		return this._size.y
	}
	/** The size of the box */
	public get size() {
		return this._size
	}
	/** Parent entity's X position */
	public get x() {
		return this._parent.x
	}
	/** Parent entity's Y position */
	public get y() {
		return this._parent.y
	}
	/** Parent entity's position */
	public get pos() {
		return this._parent.pos.copy()
	}
	/** The width of the box */
	public set width(v: number) {
		this._size.x = v
	}
	/** The height of the box */
	public set height(v: number) {
		this._size.y = v
	}
	/** The size of the box */
	public set size(v: Vector) {
		this._size = v
	}

	// functions
	/** @returns A copy of the collision box */
	public copy() {
		return new CollisionBox(this._parent, this.width, this.height)
	}
	/** Returns the collision box as a string */
	public to_string() {
		return JSON.stringify(this)
	}
}
