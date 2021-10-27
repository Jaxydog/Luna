var Shorthand;
(function (Shorthand) {
    let Lexer;
    (function (Lexer) {
        Lexer.Tokens = {
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
        };
        let original = null;
        Lexer.code = null;
        function error(reason, pos) {
            throw new Error(`(${pos.line}:${pos.char}) - ${reason}`);
        }
        function* splitter() {
            let i = 0;
            while (i < Lexer.code.length) {
                yield Lexer.code.substr(i, 1);
                i++;
            }
        }
        Lexer.splitter = splitter;
        function parse(input) {
            original = input;
            Lexer.code = input.trim();
            console.log(splitter().next().value);
            console.log(splitter().next().value);
            console.log(splitter().next().value);
            console.log(splitter().next().value);
            console.log(splitter().next().value);
        }
        Lexer.parse = parse;
    })(Lexer = Shorthand.Lexer || (Shorthand.Lexer = {}));
})(Shorthand || (Shorthand = {}));
