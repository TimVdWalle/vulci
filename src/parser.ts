// Phase 8

import {
  AssignmentExpression,
  BuiltInTypeName,
  BinaryExpression,
  BooleanLiteral,
  ComparisonChainExpression,
  ConditionalBranch,
  ConditionalExpression,
  Expression,
  ExpressionStatement,
  FunctionCall,
  FunctionDeclaration,
  IntegerLiteral,
  NullLiteral,
  Program,
  ReturnExpression,
  Statement,
  TypeAnnotation,
  UnaryExpression,
  VariableReference,
} from "./ast.js";
import { Token, TokenType } from "./token.js";

export class Parser {
  private static readonly BUILT_IN_TYPE_NAMES = new Set<string>([
    "int",
    "bool",
    "str",
    "list",
    "set",
    "map",
    "any",
    "null",
  ]);

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
    if (this.match(TokenType.Fn)) {
      return {
        type: "ExpressionStatement",
        expression: this.functionDeclaration(this.previous()),
      };
    }

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

    this.skipNewlines();

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

    while (true) {
      this.skipNewlinesBefore(TokenType.Or);

      if (!this.match(TokenType.Or)) {
        break;
      }

      const operator = this.previous();

      this.skipNewlines();

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

    while (true) {
      this.skipNewlinesBefore(TokenType.And);

      if (!this.match(TokenType.And)) {
        break;
      }

      const operator = this.previous();

      this.skipNewlines();

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

      this.skipNewlines();

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

    while (true) {
      this.skipNewlinesBefore(
        TokenType.EqualEqual,
        TokenType.BangEqual,
        TokenType.Less,
        TokenType.LessEqual,
        TokenType.Greater,
        TokenType.GreaterEqual,
      );

      if (!this.isComparisonOperator(this.peek().type)) {
        break;
      }

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

      this.skipNewlines();

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

    while (true) {
      this.skipNewlinesBefore(TokenType.Plus, TokenType.Minus);

      if (!this.match(TokenType.Plus, TokenType.Minus)) {
        break;
      }

      const operator = this.previous();

      this.skipNewlines();

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

    while (true) {
      this.skipNewlinesBefore(
        TokenType.Star,
        TokenType.Slash,
        TokenType.Percent,
      );

      if (!this.match(TokenType.Star, TokenType.Slash, TokenType.Percent)) {
        break;
      }

      const operator = this.previous();

      this.skipNewlines();

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

      this.skipNewlines();

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

    if (this.match(TokenType.Return)) {
      return this.returnExpression(this.previous());
    }

    if (this.match(TokenType.Identifier)) {
      const identifier = this.previous();

      if (this.match(TokenType.LeftParen)) {
        return this.finishFunctionCall(identifier);
      }

      const node: VariableReference = {
        type: "VariableReference",
        name: identifier.lexeme,
      };

      return node;
    }

    if (this.match(TokenType.LeftParen)) {
      this.skipNewlines();

      const expression = this.expression();

      this.skipNewlines();

      this.consume(TokenType.RightParen, "Expected ')' after expression.");

      return expression;
    }

    throw this.error(this.peek(), "Expected expression.");
  }

  private functionDeclaration(keyword: Token): FunctionDeclaration {
    const name = this.consume(
      TokenType.Identifier,
      "Expected function name after 'fn'.",
    );

    if (name.lexeme.startsWith("$")) {
      throw this.error(name, "Function names cannot be global identifiers.");
    }

    this.consume(TokenType.LeftParen, "Expected '(' after function name.");

    const parameters: Token[] = [];
    const parameterTypes: (TypeAnnotation | null)[] = [];
    const parameterNames = new Set<string>();
    let hasExplicitParameterType = false;

    if (!this.check(TokenType.RightParen)) {
      do {
        if (this.check(TokenType.Pipe)) {
          throw this.error(this.peek(), "A union type cannot start with '|'.");
        }

        const first = this.consumeTypeName("Expected parameter name or type.");

        let parameter: Token;
        let parameterType: TypeAnnotation | null = null;

        const startsTypedParameter =
          Parser.BUILT_IN_TYPE_NAMES.has(first.lexeme) ||
          this.check(TokenType.Pipe) ||
          this.check(TokenType.Identifier);

        if (startsTypedParameter) {
          parameterType = this.finishTypeAnnotation(first);
          hasExplicitParameterType = true;

          parameter = this.consume(
            TokenType.Identifier,
            "Expected parameter name after type declaration.",
          );
        } else {
          parameter = first;

          this.emitStrongWarning(
            `parameter '${parameter.lexeme}' has no declared type and is treated as 'any'`,
            parameter,
          );
        }

        if (parameter.lexeme.startsWith("$")) {
          throw this.error(
            parameter,
            "Function parameters cannot be global identifiers.",
          );
        }

        if (parameterNames.has(parameter.lexeme)) {
          throw this.error(
            parameter,
            `Duplicate parameter '${parameter.lexeme}'.`,
          );
        }

        parameterNames.add(parameter.lexeme);
        parameters.push(parameter);
        parameterTypes.push(parameterType);
      } while (this.match(TokenType.Comma));
    }

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function parameters.",
    );

    let returnType: TypeAnnotation | undefined;

    if (this.match(TokenType.Returns)) {
      if (this.check(TokenType.Pipe)) {
        throw this.error(this.peek(), "A union type cannot start with '|'.");
      }

      const firstReturnType = this.consumeTypeName(
        "Expected return type after 'returns'.",
      );

      returnType = this.finishTypeAnnotation(firstReturnType);
    } else {
      this.emitStrongWarning(
        `function '${name.lexeme}' has no declared return type and is treated as 'any'`,
        name,
      );
    }

    const node: FunctionDeclaration = {
      type: "FunctionDeclaration",
      keyword,
      name,
      parameters,
      expressions: this.functionExpressionBlock(),
    };

    if (hasExplicitParameterType) {
      node.parameterTypes = parameterTypes;
    }

    if (returnType !== undefined) {
      node.returnType = returnType;
    }

    return node;
  }

  private finishTypeAnnotation(first: Token): TypeAnnotation {
    this.validateTypeName(first);

    const members: Token[] = [first];
    const memberNames = new Set<string>([first.lexeme]);

    while (this.match(TokenType.Pipe)) {
      const separator = this.previous();

      if (separator.whitespaceBefore || separator.whitespaceAfter) {
        this.emitWarning(
          "whitespace around union separator '|' is valid but discouraged",
          separator,
        );
      }

      if (this.check(TokenType.Pipe)) {
        throw this.error(
          this.peek(),
          "A union type cannot contain repeated '|'.",
        );
      }

      const member = this.consumeTypeName("Expected a type name after '|'.");

      this.validateTypeName(member);

      if (memberNames.has(member.lexeme)) {
        throw this.error(member, `Duplicate union member '${member.lexeme}'.`);
      }

      memberNames.add(member.lexeme);
      members.push(member);
    }

    if (members.length > 1 && memberNames.has("any")) {
      const anyMember = members.find((member) => member.lexeme === "any")!;

      throw this.error(anyMember, "'any' cannot appear inside a union type.");
    }

    if (members.length === 1 && first.lexeme === "any") {
      this.emitWarning("explicit 'any' type declaration", first);
    }

    return { members };
  }

  private validateTypeName(token: Token): asserts token is Token & {
    lexeme: BuiltInTypeName;
  } {
    if (!Parser.BUILT_IN_TYPE_NAMES.has(token.lexeme)) {
      throw this.error(token, `Unknown type name '${token.lexeme}'.`);
    }
  }

  private emitWarning(message: string, token: Token): void {
    console.warn(`warning: ${message} at ${token.line}:${token.column}`);
  }

  private emitStrongWarning(message: string, token: Token): void {
    console.warn(`strong warning: ${message} at ${token.line}:${token.column}`);
  }

  private returnExpression(keyword: Token): ReturnExpression {
    if (
      this.check(TokenType.Newline) ||
      this.check(TokenType.RightBrace) ||
      this.check(TokenType.EOF)
    ) {
      return {
        type: "ReturnExpression",
        keyword,
        value: null,
      };
    }

    return {
      type: "ReturnExpression",
      keyword,
      value: this.expression(),
    };
  }

  private conditionalExpression(firstKeyword: Token): ConditionalExpression {
    this.skipNewlines();

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
        this.skipNewlines();
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

    this.skipNewlines();

    const condition = this.expression();

    this.skipNewlines();

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
      const expression = this.expression();

      expressions.push(expression);

      if (this.check(TokenType.RightBrace)) {
        break;
      }

      if (this.isAtEnd()) {
        throw this.error(this.peek(), "Expected '}' after branch body.");
      }

      this.consume(TokenType.Newline, "Expected a newline after expression.");

      this.skipNewlines();

      if (
        expression.type === "ReturnExpression" &&
        !this.check(TokenType.RightBrace)
      ) {
        throw this.error(
          this.peek(),
          "Unreachable expression after unconditional return.",
        );
      }
    }

    this.consume(TokenType.RightBrace, "Expected '}' after branch body.");

    return expressions;
  }

  private functionExpressionBlock(): Expression[] {
    this.skipNewlines();

    this.consume(TokenType.LeftBrace, "Expected '{' before function body.");

    this.skipNewlines();

    if (this.check(TokenType.RightBrace)) {
      throw this.error(this.peek(), "Function bodies cannot be empty.");
    }

    const expressions: Expression[] = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const expression = this.expression();

      expressions.push(expression);

      if (this.check(TokenType.RightBrace)) {
        break;
      }

      if (this.isAtEnd()) {
        throw this.error(this.peek(), "Expected '}' after function body.");
      }

      this.consume(TokenType.Newline, "Expected a newline after expression.");

      this.skipNewlines();

      if (
        expression.type === "ReturnExpression" &&
        !this.check(TokenType.RightBrace)
      ) {
        throw this.error(
          this.peek(),
          "Unreachable expression after unconditional return.",
        );
      }
    }

    this.consume(TokenType.RightBrace, "Expected '}' after function body.");

    return expressions;
  }

  private finishFunctionCall(calleeToken: Token): FunctionCall {
    const arguments_: Expression[] = [];

    this.skipNewlines();

    if (!this.check(TokenType.RightParen)) {
      do {
        this.skipNewlines();
        arguments_.push(this.expression());
        this.skipNewlines();
      } while (this.match(TokenType.Comma));
    }

    this.skipNewlines();

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function arguments.",
    );

    return {
      type: "FunctionCall",
      callee: calleeToken.lexeme,
      calleeToken,
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

  private skipNewlinesBefore(...types: TokenType[]): void {
    const originalPosition = this.current;

    this.skipNewlines();

    if (!types.some((type) => this.check(type))) {
      this.current = originalPosition;
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

  private consumeTypeName(message: string): Token {
    if (this.match(TokenType.Identifier, TokenType.Null)) {
      return this.previous();
    }

    throw this.error(this.peek(), message);
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
