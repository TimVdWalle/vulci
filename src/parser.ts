import {
  Expression,
  ExpressionStatement,
  FunctionCall,
  IntegerLiteral,
  Program,
  Statement,
  VariableAssignment,
  VariableReference,
} from "./ast.js";
import { Token, TokenType } from "./token.js";

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  public parse(): Program {
    const statements: Statement[] = [];

    this.skipNewlines();

    while (!this.isAtEnd()) {
      statements.push(this.statement());
      this.consumeStatementEnd();
      this.skipNewlines();
    }

    return {
      type: "Program",
      statements,
    };
  }

  private statement(): Statement {
    if (this.check(TokenType.Identifier) && this.checkNext(TokenType.Assign)) {
      return this.variableAssignment();
    }

    return this.expressionStatement();
  }

  private variableAssignment(): VariableAssignment {
    const name = this.consume(TokenType.Identifier, "Expected variable name.");

    this.consume(TokenType.Assign, "Expected '=' after variable name.");

    return {
      type: "VariableAssignment",
      name: name.lexeme,
      value: this.expression(),
    };
  }

  private expressionStatement(): ExpressionStatement {
    return {
      type: "ExpressionStatement",
      expression: this.expression(),
    };
  }

  private expression(): Expression {
    if (this.match(TokenType.Integer)) {
      const token = this.previous();

      const node: IntegerLiteral = {
        type: "IntegerLiteral",
        value: Number.parseInt(token.lexeme, 10),
      };

      return node;
    }

    if (this.match(TokenType.Identifier)) {
      const identifier = this.previous();

      if (this.match(TokenType.LeftParen)) {
        return this.finishFunctionCall(identifier.lexeme);
      }

      const node: VariableReference = {
        type: "VariableReference",
        name: identifier.lexeme,
      };

      return node;
    }

    throw this.error(this.peek(), "Expected expression.");
  }

  private finishFunctionCall(callee: string): FunctionCall {
    const arguments_: Expression[] = [];

    if (!this.check(TokenType.RightParen)) {
      do {
        arguments_.push(this.expression());
      } while (this.match(TokenType.Comma));
    }

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function arguments.",
    );

    return {
      type: "FunctionCall",
      callee,
      arguments: arguments_,
    };
  }

  private consumeStatementEnd(): void {
    if (this.match(TokenType.Newline)) {
      return;
    }

    if (this.check(TokenType.EOF)) {
      return;
    }

    throw this.error(this.peek(), "Expected a newline after statement.");
  }

  private skipNewlines(): void {
    while (this.match(TokenType.Newline)) {
      // Skip blank lines.
    }
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return type === TokenType.EOF;
    }

    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    const next = this.tokens[this.current + 1];

    return next?.type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    const token = this.tokens[this.current];

    if (!token) {
      throw new Error("Parser reached the end of the token stream.");
    }

    return token;
  }

  private previous(): Token {
    const token = this.tokens[this.current - 1];

    if (!token) {
      throw new Error("Parser has no previous token.");
    }

    return token;
  }

  private error(token: Token, message: string): Error {
    return new Error(`${message} at ${token.line}:${token.column}`);
  }
}
