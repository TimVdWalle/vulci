// Phase 9

import { Expression } from "../ast.js";
import { Token, TokenType } from "../token.js";
import { sourceError } from "../diagnostics/source-error.js";
import { reportWarning } from "../diagnostics/warning-reporter.js";

export abstract class ParserContext {
  protected static readonly BUILT_IN_TYPE_NAMES = new Set<string>([
    "int",
    "bool",
    "str",
    "list",
    "set",
    "map",
    "any",
    "null",
  ]);

  protected current = 0;

  constructor(protected readonly tokens: Token[]) {}

  protected abstract expression(): Expression;
  protected abstract containsAssignment(expression: Expression): boolean;

  protected consumeStatementEnd(): void {
    if (this.match(TokenType.Newline)) {
      return;
    }

    if (this.check(TokenType.EOF)) {
      return;
    }

    throw this.error(this.peek(), "Expected a newline after statement.");
  }

  protected skipNewlines(): void {
    while (this.match(TokenType.Newline)) {
      // Skip blank lines.
    }
  }

  protected skipNewlinesBefore(...types: TokenType[]): void {
    const originalPosition = this.current;

    this.skipNewlines();

    if (!types.some((type) => this.check(type))) {
      this.current = originalPosition;
    }
  }

  protected isComparisonOperator(type: TokenType): boolean {
    return (
      type === TokenType.EqualEqual ||
      type === TokenType.BangEqual ||
      type === TokenType.Less ||
      type === TokenType.LessEqual ||
      type === TokenType.Greater ||
      type === TokenType.GreaterEqual
    );
  }

  protected comparisonCategory(type: TokenType): "equality" | "ordering" {
    if (type === TokenType.EqualEqual || type === TokenType.BangEqual) {
      return "equality";
    }

    return "ordering";
  }

  protected consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  protected match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  protected check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return type === TokenType.EOF;
    }

    return this.peek().type === type;
  }

  protected checkNext(type: TokenType): boolean {
    const token = this.tokens[this.current + 1];

    return token?.type === type;
  }

  protected advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  protected isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  protected peek(): Token {
    const token = this.tokens[this.current];

    if (!token) {
      throw new Error("Parser reached the end of the token stream.");
    }

    return token;
  }

  protected previous(): Token {
    const token = this.tokens[this.current - 1];

    if (!token) {
      throw new Error("Parser has no previous token.");
    }

    return token;
  }

  protected emitWarning(message: string, token: Token): void {
    reportWarning("warning", message, token);
  }

  protected emitStrongWarning(message: string, token: Token): void {
    reportWarning("strong warning", message, token);
  }

  protected error(token: Token, message: string): Error {
    return sourceError(token, message);
  }
}
