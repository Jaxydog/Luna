namespace Shorthand {
	export namespace Lexer {
		export const Tokens = {
			"=": "EQUALS",
			"+": "PLUS",
			"-": "MINUS",
			"*": "ASTERISK",
			"/": "SLASH",
			"%": "PERCENT",
			"^": "CIRCUMFLEX",
			"?": "CONDITION",
			"!": "NOT",
			"<": "ANGLE_L",
			">": "ANGLE_R",
			"(": "PAREN_L",
			")": "PAREN_R",
			"[": "BRACKET_L",
			"]": "BRACKET_R",
			"{": "BRACE_L",
			"}": "BRACE_R",
			"|": "PIPE",
			"&": "AMPERSAND",
			"#": "OCTOTHORPE",
			$: "DOLLARSIGN",
			'"': "DOUBLEQUOTE",
			"'": "SINGLEQUOTE",
			"`": "GRAVEMARK",
		}

		let original: string = null
		export let code: string = null

		function error(reason: string, pos: { line: number; char: number }) {
			throw new Error(`(${pos.line}:${pos.char}) - ${reason}`)
		}

		export function* splitter() {
			let i = 0
			while (i < code.length) {
				yield code.substr(i, 1)
				i++
			}
		}

		export function parse(input: string) {
			original = input
			code = input.trim()

			console.log(splitter().next().value)
			console.log(splitter().next().value)
			console.log(splitter().next().value)
			console.log(splitter().next().value)
			console.log(splitter().next().value)
		}
	}
}
