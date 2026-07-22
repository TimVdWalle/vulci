// Phase 6

import {
  AssignmentExpression,
  BinaryExpression,
  BooleanLiteral,
  ComparisonChainExpression,
  ConditionalBranch,
  ConditionalExpression,
  Expression,
  ExpressionStatement,
  FunctionCall,
  IntegerLiteral,
  NullLiteral,
  Program,
  Statement,
  UnaryExpression,
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
    return this.expressionStatement();
  }

  private expressionStatement(): ExpressionStatement {
    return {
      type: "ExpressionStatement",
      expression: this.expression(),
    };
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expression = this.or();

    if (!this.match(TokenType.Assign)) {
      return expression;
    }

    const operator = this.previous();
    const value = this.assignment();

    if (expression.type !== "VariableReference") {
      throw this.error(operator, "Invalid assignment target.");
    }

    const node: AssignmentExpression = {
      type: "AssignmentExpression",
      name: expression.name,
      value,
    };

    return node;
  }

  private or(): Expression {
    let expression = this.and();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.and();

      const node: BinaryExpression = {
        type: "BinaryExpression",
        left: expression,
        operator,
        right,
      };

      expression = node;
    }

    return expression;
  }

  private and(): Expression {
    let expression = this.not();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.not();

      const node: BinaryExpression = {
        type: "BinaryExpression",
        left: expression,
        operator,
        right,
      };

      expression = node;
    }

    return expression;
  }

  private not(): Expression {
    if (this.match(TokenType.Not)) {
      const operator = this.previous();

      const node: UnaryExpression = {
        type: "UnaryExpression",
        operator,
        operand: this.not(),
      };

      return node;
    }

    return this.comparison();
  }

  private comparison(): Expression {
    const operands: Expression[] = [this.addition()];
    const operators: Token[] = [];

    let category: "equality" | "ordering" | null = null;

    while (this.isComparisonOperator(this.peek().type)) {
      const operator = this.advance();
      const operatorCategory = this.comparisonCategory(operator.type);

      if (category !== null && category !== operatorCategory) {
        throw this.error(
          operator,
          "Equality and ordering operators cannot be mixed in one comparison chain.",
        );
      }

      category = operatorCategory;
      operators.push(operator);
      operands.push(this.addition());
    }

    if (operators.length === 0) {
      return operands[0]!;
    }

    if (operators.length === 1) {
      const node: BinaryExpression = {
        type: "BinaryExpression",
        left: operands[0]!,
        operator: operators[0]!,
        right: operands[1]!,
      };

      return node;
    }

    const node: ComparisonChainExpression = {
      type: "ComparisonChainExpression",
      operands,
      operators,
    };

    return node;
  }

  private addition(): Expression {
    let expression = this.multiplication();

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.multiplication();

      const node: BinaryExpression = {
        type: "BinaryExpression",
        left: expression,
        operator,
        right,
      };

      expression = node;
    }

    return expression;
  }

  private multiplication(): Expression {
    let expression = this.unary();

    while (this.match(TokenType.Star, TokenType.Slash, TokenType.Percent)) {
      const operator = this.previous();
      const right = this.unary();

      const node: BinaryExpression = {
        type: "BinaryExpression",
        left: expression,
        operator,
        right,
      };

      expression = node;
    }

    return expression;
  }

  private unary(): Expression {
    if (this.match(TokenType.Minus)) {
      const operator = this.previous();

      if (this.check(TokenType.Minus)) {
        throw this.error(
          this.peek(),
          "Repeated negation requires parentheses.",
        );
      }

      const node: UnaryExpression = {
        type: "UnaryExpression",
        operator,
        operand: this.primary(),
      };

      return node;
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.Integer)) {
      const token = this.previous();
      const value = Number.parseInt(token.lexeme.replaceAll("_", ""), 10);

      if (!Number.isSafeInteger(value)) {
        throw this.error(
          token,
          "Integer literal is outside the supported range.",
        );
      }

      const node: IntegerLiteral = {
        type: "IntegerLiteral",
        value,
      };

      return node;
    }

    if (this.match(TokenType.True, TokenType.False)) {
      const token = this.previous();

      const node: BooleanLiteral = {
        type: "BooleanLiteral",
        value: token.type === TokenType.True,
      };

      return node;
    }

    if (this.match(TokenType.Null)) {
      const node: NullLiteral = {
        type: "NullLiteral",
      };

      return node;
    }

    if (this.match(TokenType.If)) {
      return this.conditionalExpression(this.previous());
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

    if (this.match(TokenType.LeftParen)) {
      const expression = this.expression();

      this.consume(TokenType.RightParen, "Expected ')' after expression.");

      return expression;
    }

    throw this.error(this.peek(), "Expected expression.");
  }

  private conditionalExpression(firstKeyword: Token): ConditionalExpression {
    const branches: ConditionalBranch[] = [
      this.conditionalBranch(firstKeyword),
    ];

    let elseKeyword: Token | null = null;
    let elseExpressions: Expression[] | null = null;

    while (true) {
      const positionBeforeNewlines = this.current;

      this.skipNewlines();

      if (!this.match(TokenType.Else)) {
        this.current = positionBeforeNewlines;
        break;
      }

      const currentElse = this.previous();

      this.skipNewlines();

      if (this.match(TokenType.If)) {
        branches.push(this.conditionalBranch(this.previous()));

        continue;
      }

      elseKeyword = currentElse;
      elseExpressions = this.expressionBlock();
      break;
    }

    const node: ConditionalExpression = {
      type: "ConditionalExpression",
      branches,
      elseKeyword,
      elseExpressions,
    };

    return node;
  }

  private conditionalBranch(keyword: Token): ConditionalBranch {
    this.consume(TokenType.LeftParen, "Expected '(' after 'if'.");

    const condition = this.expression();

    this.consume(TokenType.RightParen, "Expected ')' after condition.");

    return {
      keyword,
      condition,
      expressions: this.expressionBlock(),
    };
  }

  private expressionBlock(): Expression[] {
    this.skipNewlines();

    this.consume(TokenType.LeftBrace, "Expected '{' before branch body.");

    this.skipNewlines();

    if (this.check(TokenType.RightBrace)) {
      throw this.error(this.peek(), "Conditional branches cannot be empty.");
    }

    const expressions: Expression[] = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      expressions.push(this.expression());

      if (this.check(TokenType.RightBrace)) {
        break;
      }

      if (this.isAtEnd()) {
        throw this.error(this.peek(), "Expected '}' after branch body.");
      }

      this.consume(TokenType.Newline, "Expected a newline after expression.");

      this.skipNewlines();
    }

    this.consume(TokenType.RightBrace, "Expected '}' after branch body.");

    return expressions;
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

  private isComparisonOperator(type: TokenType): boolean {
    return (
      type === TokenType.EqualEqual ||
      type === TokenType.BangEqual ||
      type === TokenType.Less ||
      type === TokenType.LessEqual ||
      type === TokenType.Greater ||
      type === TokenType.GreaterEqual
    );
  }

  private comparisonCategory(type: TokenType): "equality" | "ordering" {
    if (type === TokenType.EqualEqual || type === TokenType.BangEqual) {
      return "equality";
    }

    return "ordering";
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
