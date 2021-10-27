/**
 * Provides generic utility features
 * @namespace LunaUtil
 */
namespace LunaUtil {
	/** @type Defines a number for use in range definitions */
	export type RangeNumber = `${"" | "="}${number}`
	/** @type Defines a range string */
	export type RangeString = `${RangeNumber}..${RangeNumber}`
	/**
	 * Represents a range of numbers
	 * @class Range
	 */
	export class Range {
		private min: number
		private max: number
		private include_min: boolean
		private include_max: boolean

		/**
		 * Parses a `RangeNumber` and returns its values
		 * @param n Number string
		 * @returns Number metadata
		 */
		public static parse_num(n: RangeNumber) {
			return {
				num: +n.replace("=", ""),
				include: n.includes("="),
			}
		}

		/**
		 * Creates a range from the given input
		 * @param range String such as `"0..=1"`
		 */
		public static of(range: RangeString) {
			let raw = range.split("..") as RangeNumber[]
			let [min, max] = raw.map((n) => Range.parse_num(n))
			let instance = new Range()

			instance.include_min = min.include
			instance.include_max = max.include
			instance.min = min.num
			instance.max = max.num

			return instance
		}

		/**
		 * Checks whether the given number is in the range
		 * @param n Number to check
		 * @returns Whether the number is within the range
		 */
		public includes(n: number) {
			let within = true
			within = within && (this.include_min ? n >= this.min : n > this.min)
			within = within && (this.include_max ? n <= this.max : n < this.max)
			return within
		}

		/**
		 * Clamps a number to the given range
		 * @param n Number to check
		 * @returns Number that conforms to range
		 */
		public clamp(n: number) {
			if (this.includes(n)) return n
			else if (n < this.min || n <= this.min) return this.min
			else if (n > this.max || n >= this.max) return this.max
			else return n
		}

		/** Returns the range as a string */
		public to_string() {
			let min = `${this.include_min ? "=" : ""}${this.min}`
			let max = `${this.include_max ? "=" : ""}${this.max}`
			return `Range(${min}..${max})`
		}
	}

	/**
	 * Waits for the given amount of time
	 * @param ms Time to wait in milliseconds
	 */
	export async function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}
