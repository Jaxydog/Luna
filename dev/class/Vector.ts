/**
 * @class Vector class
 * @property X position
 * @property Y position
 */
class Vector {
	// properties
	private _x: number
	private _y: number

	// constructor
	/**
	 * @constructor Creates a new vector
	 * @param x X position
	 * @param y Y position
	 */
	constructor(x: number, y: number) {
		this._x = x
		this._y = y
	}

	// static getters / setters
	/** A (1, 1) vector */
	public static get unit() {
		return new Vector(1, 1)
	}
	/** A (0, 0) vector */
	public static get zero() {
		return new Vector(0, 0)
	}

	// getters / setters
	/** X position */
	public get x() {
		return this._x
	}
	/** Y position */
	public get y() {
		return this._y
	}
	/** X position */
	public set x(v: number) {
		this._x = v
	}
	/** Y position */
	public set y(v: number) {
		this._y = v
	}

	// static functions
	/**
	 * Returns the reciprocal of the given vector
	 * @param v Vector
	 * @returns Vector
	 */
	public static reciprocal(v: Vector) {
		return v.copy().reciprocal()
	}
	/**
	 * Returns the inverse of the given vector
	 * @param v Vector
	 * @returns Vector
	 */
	public static inverse(v: Vector) {
		return v.copy().inverse()
	}
	/**
	 * Returns a copy of the given vector
	 * @param v Vector
	 * @returns Vector
	 */
	public static copy(v: Vector) {
		return v.copy()
	}

	/**
	 * Adds values to a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static add(v: Vector, x = 0, y = 0) {
		return v.copy().add(x, y)
	}
	/**
	 * Subtracts values from a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static sub(v: Vector, x = 0, y = 0) {
		return v.copy().sub(x, y)
	}
	/**
	 * Multiplies a vector by the given values
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static mul(v: Vector, x = 1, y = 1) {
		return v.copy().mul(x, y)
	}
	/**
	 * Divides a vector by the given values
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static div(v: Vector, x = 1, y = 1) {
		return v.copy().div(x, y)
	}
	/**
	 * Raises a vector to the given powers
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static pow(v: Vector, x = 1, y = 1) {
		return v.copy().pow(x, y)
	}
	/**
	 * Roots a vector by the given values
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public static vrt(v: Vector, x = 1, y = 1) {
		return v.copy().vrt(x, y)
	}

	/**
	 * Adds the given value to both values of a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static add_one(v: Vector, n = 0) {
		return v.copy().add_one(n)
	}
	/**
	 * Subtracts the given value from both values of a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static sub_one(v: Vector, n = 0) {
		return v.copy().sub_one(n)
	}
	/**
	 * Multiplies both values of a vector by the given values
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static mul_one(v: Vector, n = 1) {
		return v.copy().mul_one(n)
	}
	/**
	 * Divides both values of a vector by the given values
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static div_one(v: Vector, n = 1) {
		return v.copy().div_one(n)
	}
	/**
	 * Raises both values of a vector by the given value
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static pow_one(v: Vector, n = 1) {
		return v.copy().pow_one(n)
	}
	/**
	 * Roots both values of a vector by the given value
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v Vector
	 * @param n Value
	 * @returns Vector
	 */
	public static vrt_one(v: Vector, n = 1) {
		return v.copy().vrt_one(n)
	}

	/**
	 * Adds a vector to a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static add_vec(v1: Vector, v2 = Vector.zero) {
		return v1.copy().add_vec(v2)
	}
	/**
	 * Subtracts a vector from a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static sub_vec(v1: Vector, v2 = Vector.zero) {
		return v1.copy().sub_vec(v2)
	}
	/**
	 * Multiplies a vector from a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static mul_vec(v1: Vector, v2 = Vector.unit) {
		return v1.copy().mul_vec(v2)
	}
	/**
	 * Divides a vector by a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static div_vec(v1: Vector, v2 = Vector.unit) {
		return v1.copy().div_vec(v2)
	}
	/**
	 * Raises a vector by a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static pow_vec(v1: Vector, v2 = Vector.unit) {
		return v1.copy().pow_vec(v2)
	}
	/**
	 * Roots a vector by a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static vrt_vec(v1: Vector, v2 = Vector.unit) {
		return v1.copy().vrt_vec(v2)
	}

	/**
	 * Adds all vectors to a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vectors
	 * @returns Vector
	 */
	public static add_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().add_all(...v2)
	}
	/**
	 * Subtracts all vectors from a vector
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vectors
	 * @returns Vector
	 */
	public static sub_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().sub_all(...v2)
	}
	/**
	 * Multiplies a vector by all vectors
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vectors
	 * @returns Vector
	 */
	public static mul_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().mul_all(...v2)
	}
	/**
	 * Divides a vector by all vectors
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vectors
	 * @returns Vector
	 */
	public static div_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().div_all(...v2)
	}
	/**
	 * Raises a vector by all vectors
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static pow_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().pow_all(...v2)
	}
	/**
	 * Roots a vector by all vectors
	 *
	 * Returns a copy, not modifying the original vector
	 * @param v1 Vector
	 * @param v2 Vector
	 * @returns Vector
	 */
	public static vrt_all(v1: Vector, ...v2: Vector[]) {
		return v1.copy().vrt_all(...v2)
	}

	// functions
	/** @returns The reciprocal of the vector */
	public reciprocal() {
		this.x = 1 / this.x
		this.y = 1 / this.y
		return this
	}
	/** @returns The inverse of the vector */
	public inverse() {
		this.x = -this.x
		this.y = -this.y
		return this
	}
	/** @returns A copy of the vector */
	public copy() {
		return new Vector(this.x, this.y)
	}
	/** Returns the vector as a string */
	public to_string() {
		return `Vector(${this.x}, ${this.y})`
	}

	/**
	 * Adds the values to the vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public add(x = 0, y = 0) {
		this.x += x
		this.y += y
		return this
	}
	/**
	 * Subtracts the values from the vector
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public sub(x = 0, y = 0) {
		this.x -= x
		this.y -= y
		return this
	}
	/**
	 * Multiplies the vector by the values
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public mul(x = 1, y = 1) {
		this.x *= x
		this.y *= y
		return this
	}
	/**
	 * Divides the vector by the values
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public div(x = 1, y = 1) {
		this.x /= x
		this.y /= y
		return this
	}
	/**
	 * Raises the vector by the values
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public pow(x = 1, y = 1) {
		this.x **= x
		this.y **= y
		return this
	}
	/**
	 * Roots the vector by the values
	 * @param x X position
	 * @param y Y position
	 * @returns Vector
	 */
	public vrt(x = 1, y = 1) {
		this.x **= 1 / x
		this.y **= 1 / y
		return this
	}

	/**
	 * Adds the value to both values of the vector
	 * @param n Value
	 * @returns Vector
	 */
	public add_one(n = 0) {
		return this.add(n, n)
	}
	/**
	 * Subtracts the value from both values of the vector
	 * @param n Value
	 * @returns Vector
	 */
	public sub_one(n = 0) {
		return this.sub(n, n)
	}
	/**
	 * Multiplies both values of the vector by the value
	 * @param n Value
	 * @returns Vector
	 */
	public mul_one(n = 1) {
		return this.mul(n, n)
	}
	/**
	 * Divides both values of the vector by the value
	 * @param n Value
	 * @returns Vector
	 */
	public div_one(n = 1) {
		return this.div(n, n)
	}
	/**
	 * Raises both values of the vector by the value
	 * @param n Value
	 * @returns Vector
	 */
	public pow_one(n = 1) {
		return this.pow(n, n)
	}
	/**
	 * Roots both values of the vector by the value
	 * @param n Value
	 * @returns Vector
	 */
	public vrt_one(n = 1) {
		return this.vrt(n, n)
	}

	/**
	 * Adds a vector to the vector
	 * @param v Vector
	 * @returns Vector
	 */
	public add_vec(v = Vector.zero) {
		return this.add(v.x, v.y)
	}
	/**
	 * Subtracts a vector from the vector
	 * @param v Vector
	 * @returns Vector
	 */
	public sub_vec(v = Vector.zero) {
		return this.sub(v.x, v.y)
	}
	/**
	 * Multiplies the vector by a vector
	 * @param v Vector
	 * @returns Vector
	 */
	public mul_vec(v = Vector.unit) {
		return this.mul(v.x, v.y)
	}
	/**
	 * Divides the vector by a vector
	 * @param v Vector
	 * @returns Vector
	 */
	public div_vec(v = Vector.unit) {
		return this.div(v.x, v.y)
	}
	/**
	 * Raises the vector by a vector
	 * @param v Vector
	 * @returns Vector
	 */
	public pow_vec(v = Vector.unit) {
		return this.pow(v.x, v.y)
	}
	/**
	 * Roots the vector by a vector
	 * @param v Vector
	 * @returns Vector
	 */
	public vrt_vec(v = Vector.unit) {
		return this.vrt(v.x, v.y)
	}

	/**
	 * Adds all vectors to the vector
	 * @param v Vectors
	 * @returns Vector
	 */
	public add_all(...v: Vector[]) {
		let sum = v.reduce((l, c) => c.add_vec(l ?? Vector.zero))
		return this.add_vec(sum)
	}
	/**
	 * Subtracts all vectors from the vector
	 * @param v Vectors
	 * @returns Vector
	 */
	public sub_all(...v: Vector[]) {
		let rem = v.reduce((l, c) => c.sub_vec(l ?? Vector.zero))
		return this.sub_vec(rem)
	}
	/**
	 * Multiplies the vector by the vectors
	 * @param v Vectors
	 * @returns Vector
	 */
	public mul_all(...v: Vector[]) {
		let prd = v.reduce((l, c) => c.mul_vec(l ?? Vector.unit))
		return this.mul_vec(prd)
	}
	/**
	 * Divides the vector by the vectors
	 * @param v Vectors
	 * @returns Vector
	 */
	public div_all(...v: Vector[]) {
		let qot = v.reduce((l, c) => c.div_vec(l ?? Vector.unit))
		return this.div_vec(qot)
	}
	/**
	 * Raises the vector by the vectors
	 * @param v Vectors
	 * @returns Vector
	 */
	public pow_all(...v: Vector[]) {
		let pwr = v.reduce((l, c) => c.pow_vec(l ?? Vector.unit))
		return this.pow_vec(pwr)
	}
	/**
	 * Roots the vector by the vectors
	 * @param v Vectors
	 * @returns Vector
	 */
	public vrt_all(...v: Vector[]) {
		let vrt = v.reduce((l, c) => c.vrt_vec(l ?? Vector.unit))
		return this.vrt_vec(vrt)
	}
}
