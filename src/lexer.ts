// Phase 6

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
        if (this.match("=")) {
          this.addToken(TokenType.EqualEqual, "==", startLine, startColumn);
          return;
        }

        this.addToken(TokenType.Assign, "=", startLine, startColumn);
        return;

      case "!":
        if (this.match("=")) {
          this.addToken(TokenType.BangEqual, "!=", startLine, startColumn);
          return;
        }

        throw new Error(
          `Unexpected character '${c}' at ${startLine}:${startColumn}`,
        );

      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LessEqual, "<=", startLine, startColumn);
          return;
        }

        this.addToken(TokenType.Less, c, startLine, startColumn);
        return;

      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GreaterEqual, ">=", startLine, startColumn);
          return;
        }

        this.addToken(TokenType.Greater, c, startLine, startColumn);
        return;

      case "+":
        this.addToken(TokenType.Plus, c, startLine, startColumn);
        return;

      case "-":
        this.addToken(TokenType.Minus, c, startLine, startColumn);
        return;

      case "*":
        this.addToken(TokenType.Star, c, startLine, startColumn);
        return;

      case "/":
        if (this.match("/")) {
          while (!this.isAtEnd() && this.peek() !== "\n") {
            this.advance();
          }

          return;
        }

        if (this.match("*")) {
          this.blockComment(startLine, startColumn);
          return;
        }

        this.addToken(TokenType.Slash, c, startLine, startColumn);
        return;

      case "%":
        this.addToken(TokenType.Percent, c, startLine, startColumn);
        return;

      case "(":
        this.addToken(TokenType.LeftParen, c, startLine, startColumn);
        return;

      case ")":
        this.addToken(TokenType.RightParen, c, startLine, startColumn);
        return;

      case "{":
        this.addToken(TokenType.LeftBrace, c, startLine, startColumn);
        return;

      case "}":
        this.addToken(TokenType.RightBrace, c, startLine, startColumn);
        return;

      case ",":
        this.addToken(TokenType.Comma, c, startLine, startColumn);
        return;

      default:
        if (this.isDigit(c)) {
          this.integer(startLine, startColumn);
          return;
        }

        if (c === "_" && this.isDigit(this.peek())) {
          throw new Error(
            `Invalid integer separator at ${startLine}:${startColumn}`,
          );
        }

        if (this.isIdentifierStart(c)) {
          this.identifier(startLine, startColumn);
          return;
        }

        throw new Error(
          `Unexpected character '${c}' at ${startLine}:${startColumn}`,
        );
    }
  }

  private blockComment(line: number, column: number): void {
    let depth = 1;

    while (!this.isAtEnd()) {
      if (this.peek() === "/" && this.peekNext() === "*") {
        this.advance();
        this.advance();
        depth++;
        continue;
      }

      if (this.peek() === "*" && this.peekNext() === "/") {
        this.advance();
        this.advance();
        depth--;

        if (depth === 0) {
          return;
        }

        continue;
      }

      const c = this.advance();

      if (c === "\n") {
        this.line++;
        this.column = 1;
      }
    }

    throw new Error(`Unterminated block comment at ${line}:${column}`);
  }

  private integer(line: number, column: number): void {
    const start = this.current - 1;

    while (this.isDigit(this.peek()) || this.peek() === "_") {
      if (this.peek() === "_") {
        const separatorLine = this.line;
        const separatorColumn = this.column;

        this.advance();

        if (!this.isDigit(this.peek())) {
          throw new Error(
            `Invalid integer separator at ${separatorLine}:${separatorColumn}`,
          );
        }

        continue;
      }

      this.advance();
    }

    this.addToken(
      TokenType.Integer,
      this.source.slice(start, this.current),
      line,
      column,
    );
  }

  private identifier(line: number, column: number): void {
    const start = this.current - 1;

    while (this.isIdentifierPart(this.peek())) {
      this.advance();
    }

    const lexeme = this.source.slice(start, this.current);

    let type: TokenType;

    switch (lexeme) {
      case "true":
        type = TokenType.True;
        break;

      case "false":
        type = TokenType.False;
        break;

      case "null":
        type = TokenType.Null;
        break;

      case "if":
        type = TokenType.If;
        break;

      case "else":
        type = TokenType.Else;
        break;

      case "and":
        type = TokenType.And;
        break;

      case "or":
        type = TokenType.Or;
        break;

      case "not":
        type = TokenType.Not;
        break;

      default:
        type = TokenType.Identifier;
    }

    this.addToken(type, lexeme, line, column);
  }

  private addToken(
    type: TokenType,
    lexeme: string,
    line: number,
    column: number,
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

    return c ?? "\0";
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

    return this.source[this.current] ?? "\0";
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }

    return this.source[this.current + 1] ?? "\0";
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isIdentifierStart(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isIdentifierPart(c: string): boolean {
    return this.isIdentifierStart(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }
}
