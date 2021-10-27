/**
 * @class Collision box
 * @property Size
 */
class CollisionBox {
    // properties
    _parent;
    _size;
    // constructor
    /**
     * @constructor Creates a new collision box
     * @param width Width of the box
     * @param height Height of the box
     */
    constructor(parent, width, height) {
        this._parent = parent;
        this._size = new Vector(width, height);
    }
    // getters / setters
    /** The width of the box */
    get width() {
        return this._size.x;
    }
    /** The height of the box */
    get height() {
        return this._size.y;
    }
    /** The size of the box */
    get size() {
        return this._size;
    }
    /** Parent entity's X position */
    get x() {
        return this._parent.x;
    }
    /** Parent entity's Y position */
    get y() {
        return this._parent.y;
    }
    /** Parent entity's position */
    get pos() {
        return this._parent.pos.copy();
    }
    /** The width of the box */
    set width(v) {
        this._size.x = v;
    }
    /** The height of the box */
    set height(v) {
        this._size.y = v;
    }
    /** The size of the box */
    set size(v) {
        this._size = v;
    }
    // functions
    /** @returns A copy of the collision box */
    copy() {
        return new CollisionBox(this._parent, this.width, this.height);
    }
    /** Returns the collision box as a string */
    to_string() {
        return `CollisionBox(${this.width}, ${this.height})`;
    }
}
