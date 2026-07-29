// Phase 10

import { ExpressionStatement, Program, Statement } from "./ast.js";
import { TokenType } from "./token.js";
import { ExpressionParser } from "./parser/expression-parser.js";

export class Parser extends ExpressionParser {
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

    return {
      type: "Program",
      statements,
    };
  }

  protected statement(): Statement {
    if (this.match(TokenType.Fn)) {
      return {
        type: "ExpressionStatement",
        expression: this.functionDeclaration(this.previous()),
      };
    }

    return this.expressionStatement();
  }

  protected expressionStatement(): ExpressionStatement {
    return {
      type: "ExpressionStatement",
      expression: this.expression(),
    };
  }
}
