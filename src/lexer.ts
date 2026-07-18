import { Token, TokenType } from "./token.js";

export class Lexer {
    private readonly source: string;

    private tokens: Token[] = [];

    private current = 0;
    private line = 1;
    private column = 1;

    constructor(source: string) {
        this.source = source;
    }

    public lex(): Token[] {
        while (!this.isAtEnd()) {
            this.scanToken();
        }

        this.tokens.push({
            type: TokenType.EOF,
            lexeme: "",
            line: this.line,
            column: this.column,
        });

        return this.tokens;
    }

    private scanToken(): void {
        const startLine = this.line;
        const startColumn = this.column;

        const c = this.advance();

        switch (c) {
            case " ":
            case "\t":
            case "\r":
                return;

            case "\n":
                this.addToken(TokenType.Newline, "\n", startLine, startColumn);
                this.line++;
                this.column = 1;
                return;

            case "=":
                this.addToken(TokenType.Assign, c, startLine, startColumn);
                return;

            case "(":
                this.addToken(TokenType.LeftParen, c, startLine, startColumn);
                return;

            case ")":
                this.addToken(TokenType.RightParen, c, startLine, startColumn);
                return;

            case ",":
                this.addToken(TokenType.Comma, c, startLine, startColumn);
                return;

            case "/":
                if (this.match("/")) {
                    while (!this.isAtEnd() && this.peek() !== "\n") {
                        this.advance();
                    }
                    return;
                }

                throw new Error(
                    `Unexpected character '/' at ${startLine}:${startColumn}`
                );

            default:
                if (this.isDigit(c)) {
                    this.integer(startLine, startColumn);
                    return;
                }

                if (this.isIdentifierStart(c)) {
                    this.identifier(startLine, startColumn);
                    return;
                }

                throw new Error(
                    `Unexpected character '${c}' at ${startLine}:${startColumn}`
                );
        }
    }

    private integer(line: number, column: number): void {
        const start = this.current - 1;

        while (this.isDigit(this.peek())) {
            this.advance();
        }

        this.addToken(
            TokenType.Integer,
            this.source.slice(start, this.current),
            line,
            column
        );
    }

    private identifier(line: number, column: number): void {
        const start = this.current - 1;

        while (this.isIdentifierPart(this.peek())) {
            this.advance();
        }

        this.addToken(
            TokenType.Identifier,
            this.source.slice(start, this.current),
            line,
            column
        );
    }

    private addToken(
        type: TokenType,
        lexeme: string,
        line: number,
        column: number
    ): void {
        this.tokens.push({
            type,
            lexeme,
            line,
            column,
        });
    }

    private advance(): string {
        const c = this.source[this.current];
        this.current++;
        this.column++;
        return c;
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) {
            return false;
        }

        if (this.source[this.current] !== expected) {
            return false;
        }

        this.current++;
        this.column++;
        return true;
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return "\0";
        }

        return this.source[this.current];
    }

    private isDigit(c: string): boolean {
        return c >= "0" && c <= "9";
    }

    private isIdentifierStart(c: string): boolean {
        return (
            (c >= "a" && c <= "z") ||
            (c >= "A" && c <= "Z") ||
            c === "_"
        );
    }

    private isIdentifierPart(c: string): boolean {
        return this.isIdentifierStart(c) || this.isDigit(c);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }
}