// Phase 13

import { LexerState } from "./lexer/lexer-state.js";
import { Token, TokenType } from "./token.js";

export class Lexer extends LexerState {
  public lex(): Token[] {
    while (!this.isAtEnd()) this.scanToken();

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
    const character = this.advance();

    switch (character) {
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
        this.scanEquals(startLine, startColumn);
        return;
      case "!":
        this.scanBang(startLine, startColumn);
        return;
      case "<": {
        const inclusive = this.match("=");
        this.addToken(
          inclusive ? TokenType.LessEqual : TokenType.Less,
          inclusive ? "<=" : "<",
          startLine,
          startColumn,
        );
        return;
      }
      case ">": {
        const inclusive = this.match("=");
        this.addToken(
          inclusive ? TokenType.GreaterEqual : TokenType.Greater,
          inclusive ? ">=" : ">",
          startLine,
          startColumn,
        );
        return;
      }
      case "+":
        this.addToken(TokenType.Plus, character, startLine, startColumn);
        return;
      case "~":
        this.addToken(TokenType.Tilde, character, startLine, startColumn);
        return;
      case "-":
        this.addToken(TokenType.Minus, character, startLine, startColumn);
        return;
      case "*":
        this.addToken(TokenType.Star, character, startLine, startColumn);
        return;
      case "/":
        this.scanSlash(startLine, startColumn);
        return;
      case "%":
        this.addToken(TokenType.Percent, character, startLine, startColumn);
        return;
      case ".":
        this.addToken(TokenType.Dot, character, startLine, startColumn);
        return;
      case '"':
      case "'":
        this.scanString(startLine, startColumn);
        return;
      case "|":
        this.addToken(
          TokenType.Pipe,
          character,
          startLine,
          startColumn,
          this.hasWhitespaceBeforeCurrentToken(),
          this.hasWhitespaceAfterCurrentToken(),
        );
        return;
      case "(":
        this.addToken(TokenType.LeftParen, character, startLine, startColumn);
        return;
      case ")":
        this.addToken(TokenType.RightParen, character, startLine, startColumn);
        return;
      case "[":
        this.addToken(TokenType.LeftBracket, character, startLine, startColumn);
        return;
      case "]":
        this.addToken(
          TokenType.RightBracket,
          character,
          startLine,
          startColumn,
        );
        return;
      case "{":
        this.addToken(TokenType.LeftBrace, character, startLine, startColumn);
        return;
      case "}":
        this.addToken(TokenType.RightBrace, character, startLine, startColumn);
        return;
      case ",":
        this.addToken(TokenType.Comma, character, startLine, startColumn);
        return;
      case ":":
        this.addToken(TokenType.Colon, character, startLine, startColumn);
        return;
      case "$":
        this.scanGlobalIdentifier(startLine, startColumn);
        return;
      default:
        this.scanWordOrNumber(character, startLine, startColumn);
    }
  }

  private scanEquals(line: number, column: number): void {
    if (this.match("=")) {
      this.addToken(TokenType.EqualEqual, "==", line, column);
      return;
    }
    this.addToken(TokenType.Assign, "=", line, column);
  }

  private scanBang(line: number, column: number): void {
    if (this.match("=")) {
      this.addToken(TokenType.BangEqual, "!=", line, column);
      return;
    }
    throw new Error(`Unexpected character '!' at ${line}:${column}`);
  }

  private scanSlash(line: number, column: number): void {
    if (this.match("/")) {
      while (!this.isAtEnd() && this.peek() !== "\n") this.advance();
      return;
    }
    if (this.match("*")) {
      this.scanBlockComment(line, column);
      return;
    }
    this.addToken(TokenType.Slash, "/", line, column);
  }

  private scanWordOrNumber(
    character: string,
    line: number,
    column: number,
  ): void {
    if (this.isDigit(character)) {
      this.scanInteger(line, column);
      return;
    }

    if (character === "_" && this.isDigit(this.peek())) {
      throw new Error(`Invalid integer separator at ${line}:${column}`);
    }

    if (this.isIdentifierStart(character)) {
      this.scanIdentifier(line, column);
      return;
    }

    throw new Error(`Unexpected character '${character}' at ${line}:${column}`);
  }
}
