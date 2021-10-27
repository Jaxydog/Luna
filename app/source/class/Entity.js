/**
 * Base entity class
 * @class Entity
 * @abstract
 */
class Entity {
    // properties
    _position;
    _collision_box;
    /**
     * Creates a new entity
     * @param pos Position
     * @param collision Collision box
     */
    constructor(pos, collision) {
        this._position = pos;
        this._collision_box = collision;
    }
    // getters / setters
    /** X position */
    get x() {
        return this._position.x;
    }
    /** Y position */
    get y() {
        return this._position.y;
    }
    /** Entity position */
    get pos() {
        return this._position;
    }
    /** Collision box */
    get collision() {
        return this._collision_box;
    }
    /** X position */
    set x(v) {
        this._position.x = v;
    }
    /** Y position */
    set y(v) {
        this._position.y = v;
    }
    /** Entity position */
    set pos(v) {
        this._position = v;
    }
    /** Collision box */
    set collision(v) {
        this._collision_box = v;
    }
    // functions
    /** Returns the entity as a string */
    to_string() {
        return `Entity(${this.pos.to_string()}, ${this.collision?.to_string()})`;
    }
}
