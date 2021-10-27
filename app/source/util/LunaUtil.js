/**
 * Provides generic utility features
 * @namespace LunaUtil
 */
var LunaUtil;
(function (LunaUtil) {
    /**
     * Represents a range of numbers
     * @class Range
     */
    class Range {
        min;
        max;
        include_min;
        include_max;
        /**
         * Parses a `RangeNumber` and returns its values
         * @param n Number string
         * @returns Number metadata
         */
        static parse_num(n) {
            return {
                num: +n.replace("=", ""),
                include: n.includes("="),
            };
        }
        /**
         * Creates a range from the given input
         * @param range String such as `"0..=1"`
         */
        static of(range) {
            let raw = range.split("..");
            let [min, max] = raw.map((n) => Range.parse_num(n));
            let instance = new Range();
            instance.include_min = min.include;
            instance.include_max = max.include;
            instance.min = min.num;
            instance.max = max.num;
            return instance;
        }
        /**
         * Checks whether the given number is in the range
         * @param n Number to check
         * @returns Whether the number is within the range
         */
        includes(n) {
            let within = true;
            within = within && (this.include_min ? n >= this.min : n > this.min);
            within = within && (this.include_max ? n <= this.max : n < this.max);
            return within;
        }
        /**
         * Clamps a number to the given range
         * @param n Number to check
         * @returns Number that conforms to range
         */
        clamp(n) {
            if (this.includes(n))
                return n;
            else if (n < this.min || n <= this.min)
                return this.min;
            else if (n > this.max || n >= this.max)
                return this.max;
            else
                return n;
        }
        /** Returns the range as a string */
        to_string() {
            let min = `${this.include_min ? "=" : ""}${this.min}`;
            let max = `${this.include_max ? "=" : ""}${this.max}`;
            return `Range(${min}..${max})`;
        }
    }
    LunaUtil.Range = Range;
    /**
     * Waits for the given amount of time
     * @param ms Time to wait in milliseconds
     */
    async function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    LunaUtil.sleep = sleep;
})(LunaUtil || (LunaUtil = {}));
