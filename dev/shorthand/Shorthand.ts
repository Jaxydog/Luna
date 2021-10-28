namespace Shorthand {
	export namespace Lexer {
		let code: string
		let pos = -1

		export const Tokens = new Map([
			["=", "EQUALS"],
			["+", "PLUS"],
			["-", "MINUS"],
			["*", "ASTERISK"],
			["/", "SLASH"],
			["%", "PERCENT"],
			["^", "CIRCUMFLEX"],
			["?", "CONDITION"],
			["!", "NOT"],
			["<", "ANGLE_L"],
			[">", "ANGLE_R"],
			["(", "PAREN_L"],
			[")", "PAREN_R"],
			["[", "BRACKET_L"],
			["]", "BRACKET_R"],
			["{", "BRACE_L"],
			["}", "BRACE_R"],
			["|", "PIPE"],
			["&", "AMPERSAND"],
			["#", "OCTOTHORPE"],
			["$", "DOLLARSIGN"],
			['"', "DOUBLEQUOTE"],
			["'", "SINGLEQUOTE"],
			["`", "GRAVEMARK"],
			[":", "COLON"],
			[";", "SEMICOLON"],
			[" ", "BS_SPACE"],
			["\n", "BS_NEWLINE"],
			["\r", "BS_CARRIAGERETURN"],
			["\t", "BS_TABLINE"],
			["\\", "BS_BACKSLASH"],
			["\f", "BS_FORMFEED"],
			["\b", "BS_BACKSPACE"],
			["\v", "BS_VERTICALTAB"],
		])

		export const Clumps = new Map([
			// primitives
			[tokenize("num").join("-"), "NUMBER"],
			[tokenize("bln").join("-"), "BOOLEAN"],
			[tokenize("str").join("-"), "STRING"],
			[tokenize("nil").join("-"), "NULL"],
			// operators
			[tokenize("?=").join("-"), "CONDITIONASSIGN"],
			// conditionals
			[tokenize("<=").join("-"), "LESSTHANOREQUAL"],
			[tokenize(">=").join("-"), "GREATERTHANOREQUAL"],
			[tokenize("==").join("-"), "EQUAL"],
			[tokenize("!=").join("-"), "NOTEQUAL"],
			// reserved words
			[tokenize("fn").join("-"), "FUNCTION"],
			[tokenize("if").join("-"), "IF"],
			[tokenize("sw").join("-"), "SWITCH"],
			[tokenize("for").join("-"), "FOR"],
			[tokenize("of").join("-"), "OF"],
			[tokenize("mod").join("-"), "MODULE"],
			[tokenize("imp").join("-"), "IMPORT"],
			[tokenize("exp").join("-"), "DYNAMICEXPORT"],
			[tokenize("*exp").join("-"), "STATICEXPORT"],
			[tokenize("enm").join("-"), "ENUM"],
			[tokenize("out").join("-"), "OUTPUT"],
			[tokenize("end").join("-"), "BLOCKEND"],
			[tokenize("lbl").join("-"), "LABEL"],
		])

		function next_char() {
			return code.split("")[++pos]
		}

		function reverse_map_get<K, V>(map: Map<K, V>, value: V) {
			let map_arr = Array.of(...map.values())

			if (map_arr.includes(value)) {
				let i = map_arr.indexOf(value)
				return Array.of(...map.keys())[i]
			} else {
				return undefined
			}
		}

		function clump_key_size(input: string) {
			return input.split("").filter((v) => v === "-").length + 1
		}

		export function tokenize(input: string) {
			code = input
			pos = -1

			let output = []
			let char = next_char()

			while (char) {
				let token = Tokens.get(char)
				token ??= `NTC_${char}`
				output.push(token)
				char = next_char()
			}

			return output
		}

		export function remove_comments(input: string[]) {
			let output: string[] = []
			let comment = false

			for (let token of input) {
				if (token === "OCTOTHORPE") {
					comment = true
				} else {
					if (!comment) output.push(token)
					else if (token === "BS_NEWLINE" || token === "BS_CARRIAGERETURN") comment = false
				}
			}

			return output
		}

		export function clump(input: string[]) {
			let source = [undefined, ...input]
			let output: string[] = []

			while (input.length !== 0) {
				let clumped: string | undefined

				for (let key of Clumps.keys()) {
					let size = clump_key_size(key)
					let clump = input.slice(0, size).join("-")
					let prev = source[0]
					let next = input[size]

					let match = clump === key
					let prev_not_chr = !prev || !prev?.startsWith("NTC_")
					let next_not_chr = !next || !next?.startsWith("NTC_")

					if (match && prev_not_chr && next_not_chr) {
						clumped = clump
						break
					}
				}

				if (clumped) {
					let size = clump_key_size(clumped)
					output.push(Clumps.get(clumped))
					input.slice(0, size)
					source.splice(0, size)
				} else {
					output.push(input[0])
					input.slice(0, 1)
					source.slice(0, 1)
				}
			}

			return output
		}

		export function resolve_vars(input: string[]) {
			let output: string[] = []
			let name = ""

			for (let token of input) {
				if (token.startsWith("NTC_")) {
					name += token.replace("NTC_", "")
				} else {
					if (name !== "") output.push(`VAL_${name}`)
					output.push(token)
					name = ""
				}
			}

			if (name !== "") output.push(`VAL_${name}`)
			return output
		}

		export function resolve_strs(input: string[]) {
			let output: string[] = []
			let str = ""
			let parsing = false
			let str_type: "s" | "d"

			for (let token of input) {
				if (!parsing) {
					if (token === "SINGLEQUOTE") {
						str_type = "s"
						parsing = true
						str += "STR_'"
					} else if (token === "DOUBLEQUOTE") {
						str_type = "d"
						parsing = true
						str += 'STR_"'
					} else {
						output.push(token)
					}
				} else {
					if (token === "SINGLEQUOTE" && str_type === "s") {
						parsing = false
						str += "'"
						output.push(str)
						str = ""
					} else if (token === "DOUBLEQUOTE" && str_type === "d") {
						parsing = false
						str += '"'
						output.push(str)
						str = ""
					} else {
						let translated = reverse_map_get(Tokens, token)
						str += translated ?? token.replace("VAL_", "")
					}
				}
			}

			return output
		}

		export function remove_br_sp(input: string[]) {
			return input.filter((v) => !v.startsWith("BS_"))
		}

		export function resolve_lbls(input: string[]) {
			let output: string[] = []
			let parsing = false
			let label = ""

			for (let token of input) {
				if (token === "LABEL" && !parsing) {
					parsing = true
				} else if (parsing) {
					if (token.startsWith("VAL_") || token === "EQUALS") {
						continue
					} else if (token === "ANGLE_L") {
						label += "LBL_"
					} else if (token === "COLON") {
						label += ":"
					} else if (token === "ANGLE_R") {
						parsing = false
						output.push(label)
					} else {
						label += token
					}
				} else {
					output.push(token)
				}
			}

			return output
		}

		export function lex(input: string) {
			let tokens = tokenize(input)
			let nocomm = remove_comments(tokens)
			let clumps = clump(nocomm)
			let resvar = resolve_vars(clumps)
			let resstr = resolve_strs(resvar)
			let no_b_s = remove_br_sp(resstr)
			let reslbl = resolve_lbls(no_b_s)

			return reslbl
		}
	}
}
