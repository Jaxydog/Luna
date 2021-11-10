/** @type Defines a number for use in range definitions */
type RangeNumber = `${"" | "="}${number}`
/** @type Defines a range string */
type RangeString = `${RangeNumber}..${RangeNumber}`
/**
 * Represents a range of numbers
 * @class Range
 */
class NumberRange {
	private min: number
	private max: number
	private include_min: boolean
	private include_max: boolean

	/**
	 * Creates a range from the given input
	 * @param range String such as `"0..=1"`
	 */
	public static from(range: RangeString) {
		if (!/(=?\d+?)\.\.(=?\d+?)/.test(range)) throw new Error(`Invalid range "${range}"`)
		let min = (/(=?\d+)(?=\.\.(=?\d+))/.exec(range) ?? ["0"])[0]
		let max = (/(?<=(=?\d+)\.\.)(=?\d+)/.exec(range) ?? ["0"])[0]
		let instance = new NumberRange()

		instance.include_min = min.startsWith("=")
		instance.include_max = max.startsWith("=")
		instance.min = +min.replace("=", "")
		instance.max = +max.replace("=", "")

		return instance
	}

	/**
	 * Checks whether the given number is in the range
	 * @param n Number to check
	 * @returns Whether the number is within the range
	 */
	public includes(n: number) {
		let within = true
		within &&= this.include_min ? n >= this.min : n > this.min
		within &&= this.include_max ? n <= this.max : n < this.max
		return within
	}

	/**
	 * Clamps a number to the given range
	 * @param n Number to check
	 * @returns Number that conforms to range
	 */
	public clamp(n: number) {
		if (this.includes(n)) return n
		if (n < this.min) return this.min
		if (n > this.max) return this.max
		return n
	}

	/** Returns the range as a string */
	public to_string() {
		return JSON.stringify(this)
	}
}
