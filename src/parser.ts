// Phase 14

import { ExpressionStatement, Program, Statement } from "./ast.js";
import { ExpressionParser } from "./parser/expression-parser.js";
import { Token, TokenType } from "./token.js";

export class Parser extends ExpressionParser {
  constructor(tokens: Token[]) {
    super(tokens);
    this.discoverStructNames(tokens);
    this.discoverEnumNames(tokens);
  }

  public parseSingleExpression() {
    this.skipNewlines();
    const expression = this.expression();
    this.skipNewlines();
    this.consume(TokenType.EOF, "Expected end of interpolation expression.");
    return expression;
  }

  public parse(): Program {
    const statements: Statement[] = [];

    this.skipNewlines();

    while (!this.isAtEnd()) {
      statements.push(this.statement());
      this.consumeStatementEnd();
      this.skipNewlines();
    }

    return { type: "Program", statements };
  }

  protected statement(): Statement {
    if (this.match(TokenType.Enum)) {
      return {
        type: "ExpressionStatement",
        expression: this.enumDeclaration(this.previous()),
      };
    }

    if (this.match(TokenType.Struct)) {
      return {
        type: "ExpressionStatement",
        expression: this.structDeclaration(this.previous()),
      };
    }

    if (this.match(TokenType.Fn)) {
      return {
        type: "ExpressionStatement",
        expression: this.functionDeclaration(this.previous()),
      };
    }

    return this.expressionStatement();
  }

  protected expressionStatement(): ExpressionStatement {
    return { type: "ExpressionStatement", expression: this.expression() };
  }

  private discoverStructNames(tokens: Token[]): void {
    let braceDepth = 0;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!;

      if (token.type === TokenType.LeftBrace) {
        braceDepth++;
        continue;
      }

      if (token.type === TokenType.RightBrace) {
        braceDepth = Math.max(0, braceDepth - 1);
        continue;
      }

      if (token.type !== TokenType.Struct || braceDepth !== 0) continue;

      const name = tokens[index + 1];
      if (name?.type === TokenType.Identifier) {
        this.registerStructName(name.lexeme);
      }
    }
  }

  private discoverEnumNames(tokens: Token[]): void {
    let braceDepth = 0;

    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!;

      if (token.type === TokenType.LeftBrace) {
        braceDepth++;
        continue;
      }

      if (token.type === TokenType.RightBrace) {
        braceDepth = Math.max(0, braceDepth - 1);
        continue;
      }

      if (token.type !== TokenType.Enum || braceDepth !== 0) continue;

      const name = tokens[index + 1];
      if (name?.type === TokenType.Identifier) {
        this.registerEnumName(name.lexeme);
      }
    }
  }
}
