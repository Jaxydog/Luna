/**
 * Base entity class
 * @class Entity
 * @abstract
 */
abstract class Entity {
	// properties
	private _position: Vector
	private _collision_box?: CollisionBox

	/**
	 * Creates a new entity
	 * @param pos Position
	 * @param collision Collision box
	 */
	constructor(pos: Vector, collision: CollisionBox) {
		this._position = pos
		this._collision_box = collision
	}

	// getters / setters
	/** X position */
	public get x() {
		return this._position.x
	}
	/** Y position */
	public get y() {
		return this._position.y
	}
	/** Entity position */
	public get pos() {
		return this._position
	}
	/** Collision box */
	public get collision() {
		return this._collision_box
	}
	/** X position */
	public set x(v: number) {
		this._position.x = v
	}
	/** Y position */
	public set y(v: number) {
		this._position.y = v
	}
	/** Entity position */
	public set pos(v: Vector) {
		this._position = v
	}
	/** Collision box */
	public set collision(v: CollisionBox) {
		this._collision_box = v
	}

	// functions
	/** Returns the entity as a string */
	public to_string() {
		return `Entity(${this.pos.to_string()}, ${this.collision?.to_string()})`
	}
}
