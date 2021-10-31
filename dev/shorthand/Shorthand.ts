namespace Old {
	export namespace Lexer {
		let panicked = false
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

		function panic(reason: string) {
			console.error(reason)
			panicked = true
		}

		function next_char() {
			return code?.split("")[++pos]
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
			return input.split("").map((char, idx) => {
				return Tokens.get(char) ?? `NTC_${char}`
			})
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
					output.push(Clumps.get(clumped)!)
					input.splice(0, size)
					source.splice(0, size)
				} else {
					output.push(input[0])
					input.splice(0, 1)
					source.splice(0, 1)
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
					if (token === "SINGLEQUOTE" && str_type! === "s") {
						parsing = false
						str += "'"
						output.push(str)
						str = ""
					} else if (token === "DOUBLEQUOTE" && str_type! === "d") {
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

			input.forEach((token, idx) => {
				if (token === "LABEL" && !parsing) {
					parsing = true
				} else if (token.startsWith("VAL_") && input[idx + 1] === "ANGLE_L" && !input[idx - 1].startsWith("VAL_")) {
					parsing = true
					output.push(token)
				} else if (parsing) {
					if (token.startsWith("VAL_") || token === "EQUALS") {
						output.push(token)
					} else if (token === "ANGLE_L") {
						label += "LBL_"
					} else if (token === "COLON") {
						label += ":"
					} else if (token === "CONDITION") {
						label += "?"
					} else if (token === "ANGLE_R") {
						parsing = false
						output.push(label)
						label = ""
					} else {
						label += token
					}
				} else {
					output.push(token)
				}
			})

			return output
		}

		export function resolve_sref(input: string[]) {
			let output: string[] = []
			let ref = ""
			let joined = false

			for (let token of input) {
				if (token === "DOLLARSIGN") {
					ref += "REF_"
					joined = true
				} else {
					if (!joined) {
						output.push(token)
					} else {
						if (token.startsWith("VAL_")) {
							ref += token.replace("VAL_", "")
							output.push(ref)
						} else {
							ref += "SELF"
							output.push(ref)
							output.push(token)
						}

						joined = false
						ref = ""
					}
				}
			}

			return output
		}

		export function resolve_asgn(input: string[]) {
			let output: string[] = []
			let just_assigned = false

			input.forEach((token, idx) => {
				if (token === "EQUALS") {
					let prev = input[idx - 1]
					let next = input[idx + 1]
					let can_assign_to_prev = prev.startsWith("VAL_") || prev.startsWith("REF_")
					let can_assign_from_next = next.startsWith("VAL_") || prev.startsWith("VAL_")

					if (can_assign_to_prev && can_assign_from_next) {
						output.pop()
						output.push(`ASN_${prev}=${next}`)
						just_assigned = true
					} else {
						panic(`Misplaced "=" at ${idx}`)
					}
				} else {
					if (!just_assigned) output.push(token)
					else just_assigned = false
				}
			})

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
			let resref = resolve_sref(reslbl)
			// let resass = resolve_asgn(resref)

			return tokens
		}
	}
}

namespace Shorthand {
	const non_token = "ntc_"
	const non_symbol = "nsc_"
	const strliteral = "stl_"
	const numliteral = "nml_"
	const blnliteral = "bll_"
	const symbol = "sym_"
	const string = "str_"
	const number = "num_"
	const boolean = "bln_"
	const label = "lbl_"
	const generic = "val_"

	export namespace Lexer {
		export const Tokens = new Map([
			["`", "tkn_grave"],
			["~", "tkn_tilde"],
			["!", "tkn_exclaimation"],
			["@", "tkn_at"],
			["#", "tkn_octothorpe"],
			["$", "tkn_dollarsign"],
			["%", "tkn_percentage"],
			["^", "tkn_circumflex"],
			["&", "tkn_ampersand"],
			["*", "tkn_asterisk"],
			["(", "tkn_parenl"],
			[")", "tkn_parenr"],
			["-", "tkn_minus"],
			["+", "tkn_plus"],
			["=", "tkn_equal"],
			["{", "tkn_bracel"],
			["[", "tkn_bracketl"],
			["}", "tkn_bracer"],
			["]", "tkn_bracketr"],
			["|", "tkn_pipe"],
			["\\", "tkn_backslash"],
			[":", "tkn_colon"],
			[";", "tkn_semicolon"],
			['"', "tkn_doublequote"],
			["'", "tkn_singlequote"],
			["<", "tkn_anglel"],
			[",", "tkn_comma"],
			[">", "tkn_angler"],
			[".", "tkn_period"],
			["?", "tkn_question"],
			["/", "tkn_slash"],
			[" ", "tkn__space"],
			["\n", "tkn__newline"],
			["\r", "tkn__creturn"],
			["\t", "tkn__htab"],
			["\\", "tkn__backslash"],
			["\f", "tkn__formfeed"],
			["\b", "tkn__backspace"],
			["\v", "tkn__vtab"],
		])
		export const Symbols = new Map([
			// primitives
			[symbol_id("num"), "number"],
			[symbol_id("bln"), "boolean"],
			[symbol_id("str"), "string"],
			[symbol_id("lbl"), "label"],
			[symbol_id("nil"), "null"],
			// blocks
			[symbol_id("mod"), "module"],
			[symbol_id("fn"), "function"],
			[symbol_id("if"), "if"],
			[symbol_id("sw"), "switch"],
			[symbol_id("for"), "for"],
			[symbol_id("imp"), "import"],
			[symbol_id("exp"), "dynexport"],
			[symbol_id("*exp"), "stcexport"],
			[symbol_id("enum"), "enum"],
			[symbol_id("out"), "output"],
			[symbol_id("end"), "endblock"],
			// compound
			[symbol_id("--"), "decrement"],
			[symbol_id("++"), "increment"],
			[symbol_id("&&"), "and"],
			[symbol_id("||"), "or"],
			[symbol_id("??"), "nullcheck"],
			[symbol_id("!="), "notequal"],
			[symbol_id("=="), "equal"],
			[symbol_id("<="), "lessthanequal"],
			[symbol_id(">="), "morethanequal"],
			// assignment
			[symbol_id("^="), "powerassign"],
			[symbol_id("*="), "multiplyassign"],
			[symbol_id("-="), "subtractassign"],
			[symbol_id("+="), "addassign"],
			[symbol_id("/="), "divideassign"],
			[symbol_id("%="), "moduloassign"],
			[symbol_id("&="), "andassign"],
			[symbol_id("|="), "orassign"],
			[symbol_id("?="), "nullassign"],
			[symbol_id("="), "assign"],
			// simple
			[symbol_id("!"), "not"],
			[symbol_id("#"), "comment"],
			[symbol_id("$"), "reference"],
			[symbol_id("%"), "modulo"],
			[symbol_id("^"), "power"],
			[symbol_id("*"), "multiply"],
			[symbol_id("-"), "subtract"],
			[symbol_id("+"), "add"],
			[symbol_id("/"), "divide"],
		])

		function symbol_id(input: string) {
			return resolve_tokens(input.split("")).join("-")
		}
		function symbol_size(input: string) {
			return input.split("-").length
		}
		function reverse_get<K, V>(map: Map<K, V>, value: V) {
			let map_arr = Array.of(...map.values())
			let idx = map_arr.indexOf(value)
			return idx !== -1 ? Array.of(...map.keys())[idx] : undefined
		}

		export function resolve_tokens(input: string[]) {
			return input.map((token) => Tokens.get(token) ?? `${non_token}${token}`)
		}
		export function resolve_symbols(input: string[]) {
			let output: string[] = []
			let source = [undefined, ...input]

			while (input.length !== 0) {
				let sym: string | undefined

				for (let key of Symbols.keys()) {
					let size = symbol_size(key)
					let current = input.slice(0, size).join("-")
					let next = input[size]
					let last = source[0]

					let match = current === key
					let nextnt = !next || !next?.startsWith(non_token)
					let lastnt = !last || !last?.startsWith(non_token)

					if (match && nextnt && lastnt) {
						sym = key
						break
					}
				}

				if (sym) {
					output.push(`${symbol}${Symbols.get(sym)}`)
					input.splice(0, symbol_size(sym))
					source.splice(0, symbol_size(sym))
				} else {
					output.push(input[0].replace(non_token, non_symbol))
					input.splice(0, 1)
					source.splice(0, 1)
				}
			}

			return output
		}
		export function remove_comments(input: string[]) {
			let output: string[] = []
			let in_comment = false

			input.forEach((token) => {
				if (!in_comment) {
					if (token === `${symbol}comment`) {
						in_comment = true
					} else {
						output.push(token)
					}
				} else {
					let is_nl = token === `tkn__newline`
					let is_cr = token === `tkn__creturn`

					if (is_nl || is_cr) {
						in_comment = false
					}
				}
			})

			return output
		}
		export function remove_breaks_spaces(input: string[]) {
			return input.filter((sym) => !sym.startsWith(`tkn__`) || sym === "tkn__newline" || sym === "tkn__creturn")
		}
		export function resolve_string_literals(input: string[]) {
			let output: string[] = []
			let parsing = false
			let str_type: "d" | "s"
			let temp = ""

			input.forEach((token, idx, arr) => {
				if (!parsing) {
					switch (token) {
						case `tkn_singlequote`: {
							str_type = "s"
							parsing = true
							temp = strliteral
							break
						}
						case `tkn_doublequote`: {
							str_type = "d"
							parsing = true
							temp = strliteral
							break
						}
						default: {
							output.push(token)
						}
					}
				} else {
					switch (token) {
						case `tkn_singlequote`: {
							if (str_type === "s") {
								output.push(temp)
								parsing = false
							} else {
								temp += "'"
							}
							break
						}
						case `tkn_doublequote`: {
							if (str_type === "d") {
								output.push(temp)
								parsing = false
							} else {
								temp += '"'
							}
						}
						default: {
							let partial = token.replace(non_symbol, "")
							let translated = reverse_get(Tokens, partial)
							translated ??= reverse_get(Symbols, partial)
							translated ??= partial

							temp += translated
						}
					}
				}
			})

			return output
		}
		export function resolve_number_literals(input: string[]) {
			let output: string[] = []
			let changed = true
			let temp = numliteral

			input.forEach((token, idx, arr) => {
				let val = +token.replace(non_symbol, "")

				if (!isNaN(val)) {
					let last = arr[idx - 1]

					if (last === `tkn_plus`) {
						output.pop()
					} else if (last === `tkn_minus`) {
						output.pop()
						temp += "-"
					} else if (last === `tkn_period`) {
						output.pop()
						temp += "."
					}

					temp += val
				} else {
					if (temp !== numliteral) {
						output.push(temp)
						temp = numliteral
					}

					output.push(token)
				}
			})

			if (temp !== numliteral) {
				output.push(temp)
				temp = numliteral
			}

			while (changed) {
				changed = false

				output.forEach((token, idx, arr) => {
					if (token.startsWith(numliteral)) {
						let next = arr[idx + 1]

						if (next && next?.startsWith(numliteral)) {
							output[idx] = token + next.replace(numliteral, "")
							output.splice(idx + 1, 1)
							changed = true
						}
					}
				})
			}

			return output
		}
		export function resolve_boolean_literals(input: string[]) {
			let output: string[] = []

			input.forEach((token, idx, arr) => {
				if (token === `${non_symbol}t`) {
					let next = arr[idx + 5]
					let last = arr[idx - 1]
					let val = arr
						.slice(idx, idx + 4)
						.map((val) => val.replace(non_symbol, ""))
						.join("")

					let valtrue = val === "true"
					let nextnc = !next || !next?.startsWith(non_symbol)
					let lastnc = !last || !last?.startsWith(non_symbol)

					if (valtrue && nextnc && lastnc) {
						output.push(`${blnliteral}true`)
						arr = arr.splice(idx, 4)
					} else {
						output.push(token)
					}
				} else if (token === `${non_symbol}f`) {
					let next = arr[idx + 6]
					let last = arr[idx - 1]
					let val = arr
						.slice(idx, idx + 5)
						.map((val) => val.replace(non_symbol, ""))
						.join("")

					let valfalse = val === "false"
					let nextnc = !next || !next?.startsWith(non_symbol)
					let lastnc = !last || !last?.startsWith(non_symbol)

					if (valfalse && nextnc && lastnc) {
						output.push(`${blnliteral}false`)
						arr = arr.splice(idx, 5)
					} else {
						output.push(token)
					}
				} else {
					output.push(token)
				}
			})

			return output
		}
		export function resolve_string(input: string[]) {
			let output: string[] = []
			let temp = ""

			input.forEach((token, idx, arr) => {
				output.push(token)
			})

			return output
		}
		export function resolve_labels(input: string[]) {
			let output: string[] = []
			let parsing = false
			let lbl = ""

			input.forEach((token, idx, arr) => {
				if (!parsing) {
					if (token === `${symbol}label`) {
						lbl += label
						parsing = true
					} else if (token === `tkn_anglel`) {
						let last = arr[idx - 1]

						if (!last?.startsWith(symbol)) {
							lbl += label
							parsing = true
						}
					} else {
						output.push(token)
					}
				} else {
					if (token.startsWith(non_symbol)) {
						lbl += token.replace(non_symbol, "")
					} else
						switch (token) {
							case `${symbol}assign`: {
								break
							}
							case `tkn_anglel`: {
								lbl += "="
								break
							}
							case `tkn_colon`: {
								lbl += ":"
								break
							}
							case `tkn_question`: {
								lbl += "?"
								break
							}
							case `tkn_angler`: {
								output.push(lbl)
								parsing = false
								lbl = ""
								break
							}
							default: {
								lbl += token
								break
							}
						}
				}
			})

			return output
		}
		export function remove_newlines(input: string[]) {
			return input.filter((token) => !token.startsWith("tkn__"))
		}

		export function lex(input: string) {
			let out = resolve_tokens(input.split(""))
			out = resolve_symbols(out)
			out = remove_comments(out)
			out = remove_breaks_spaces(out)
			out = resolve_string_literals(out)
			out = resolve_number_literals(out)
			out = resolve_boolean_literals(out)
			out = resolve_string(out)
			out = resolve_labels(out)
			out = remove_newlines(out)

			return out
		}
	}
}

const test = `
# this is an example file!

# this is a module, basically a class from JavaScript
mod vec
	# labels define argument typing within the block
	lbl p = <'x':'y'>	# can use literals, plus : syntax for multiple values
	lbl v = <num>		# can regular typings

	# variable assignment is done in this format (type name = assignment)
	num x = 0	# these are private by default
	num y = 0

	# typing can include a '?' to become optional
	# exports that start with a '*' are static exports
	*exp fn new(x<num?> y<num?>)
		# the $ character is used to reference the parent, e.g. the 'this' keyword
		$x ?= x
		$y ?= y

		# the 'out' keyword is used as a return
		out $
	end	# code blocks are ended with the end keyword

	# notice that function arguments don't use commas!
	exp fn set(p v)
		# switch statement, basically works the same as 'match' from Rust
		sw (p)
			# the 'x' on the left is what the interpreter checks for
			# everything after the ? is run if the input matches the value
			'x' ? $x = v end
			'y' ? $y = v end
		end

		out $
	end

	exp fn get(p)
		sw (p)
			'x' ? out $x end
			'y' ? out $y end
		end
	end

	# notice the arguments don't need to have specified types
	# this is due to the labels at the top of the module
	exp fn add(p v)
		sw (p)
			# of course we've got compound operators
			'x' ? $x += v end
			'y' ? $y += v end
		end

		out $
	end

	exp fn multiply(p v)
		sw (p)
			'x' ? $x *= v end
			'y' ? $y *= v end
		end

		out $
	end

	fn magnitude()
		num x = $x ^ 2
		num y = $y ^ 2
		out (x + y) ^ 0.5
	end

	exp fn normal()
		num m = $magnitude
		# inline 'if' statements bay beeeeee
		if (m == 0) out $ end
		num x = $x / m
		num y = $y / m
		# access properties with a '.' just like in JavaScript
		out vec.new(x y)
	end

	exp fn to_string()
		# template strings! without the dollar sign, it's busy taking the role of 'this'
		out "vec({$x} {$y})"
	end
end
`
const test2 = `
num a = 1
num b = -1
num c = +0.5
num d = -0.5
bln a = true
bln b = false
str a = "test"
str b = 'test 2'
lbl a = <num>
lbl b = <str?>
lbl c = <'s':'d'>
lbl d = <num:bln?>
num a = nil
`

console.log(Shorthand.Lexer.lex(test).join("\n"))
