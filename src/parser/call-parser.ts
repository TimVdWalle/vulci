// Phase 12

import { Expression, FunctionCall, MemberAccess, MemberCall } from "../ast.js";
import { Token, TokenType } from "../token.js";
import { ObjectParser } from "./object-parser.js";

export abstract class CallParser extends ObjectParser {
  protected finishMember(receiver: Expression): MemberAccess | MemberCall {
    const member = this.consume(
      TokenType.Identifier,
      "Expected member name after '.'.",
    );

    if (!this.match(TokenType.LeftParen)) {
      return { type: "MemberAccess", receiver, member };
    }

    const arguments_: Expression[] = [];
    this.skipNewlines();

    while (!this.check(TokenType.RightParen)) {
      if (this.check(TokenType.Comma)) {
        throw this.error(this.peek(), "Expected argument before ','.");
      }
      arguments_.push(this.expression());
      this.skipNewlines();
      if (!this.match(TokenType.Comma)) break;
      this.skipNewlines();
      if (this.check(TokenType.RightParen)) break;
    }

    this.consume(TokenType.RightParen, "Expected ')' after member arguments.");
    return { type: "MemberCall", receiver, member, arguments: arguments_ };
  }

  protected finishFunctionCall(calleeToken: Token): FunctionCall {
    const arguments_: Expression[] = [];
    const argumentNames: (Token | null)[] = [];
    const namedArguments = new Set<string>();

    let hasNamedArgument = false;

    this.skipNewlines();

    while (!this.check(TokenType.RightParen)) {
      if (this.check(TokenType.Comma)) {
        throw this.error(this.peek(), "Expected argument before ','.");
      }

      let argumentName: Token | null = null;

      if (this.check(TokenType.Identifier) && this.checkNext(TokenType.Colon)) {
        argumentName = this.advance();

        this.advance();
        this.skipNewlines();

        if (namedArguments.has(argumentName.lexeme)) {
          throw this.error(
            argumentName,
            `Duplicate argument '${argumentName.lexeme}'.`,
          );
        }

        namedArguments.add(argumentName.lexeme);
        hasNamedArgument = true;
      } else if (hasNamedArgument) {
        throw this.error(
          this.peek(),
          "Positional arguments cannot follow named arguments.",
        );
      }

      arguments_.push(this.expression());
      argumentNames.push(argumentName);

      this.skipNewlines();

      if (!this.match(TokenType.Comma)) {
        break;
      }

      this.skipNewlines();

      if (this.check(TokenType.RightParen)) {
        break;
      }
    }

    this.consume(
      TokenType.RightParen,
      "Expected ')' after function arguments.",
    );

    return {
      type: "FunctionCall",
      callee: calleeToken.lexeme,
      calleeToken,
      arguments: arguments_,
      argumentNames,
    };
  }

  protected containsAssignment(expression: Expression): boolean {
    switch (expression.type) {
      case "AssignmentExpression":
        return true;

      case "UnaryExpression":
        return this.containsAssignment(expression.operand);

      case "BinaryExpression":
        return (
          this.containsAssignment(expression.left) ||
          this.containsAssignment(expression.right)
        );

      case "ComparisonChainExpression":
        return expression.operands.some((operand) =>
          this.containsAssignment(operand),
        );

      case "ConditionalExpression":
        return (
          expression.branches.some(
            (branch) =>
              this.containsAssignment(branch.condition) ||
              branch.expressions.some((branchExpression) =>
                this.containsAssignment(branchExpression),
              ),
          ) ||
          (expression.elseExpressions?.some((elseExpression) =>
            this.containsAssignment(elseExpression),
          ) ??
            false)
        );

      case "FunctionCall":
        return expression.arguments.some((argument) =>
          this.containsAssignment(argument),
        );

      case "MemberAccess":
        return this.containsAssignment(expression.receiver);

      case "MemberCall":
        return (
          this.containsAssignment(expression.receiver) ||
          expression.arguments.some((argument) =>
            this.containsAssignment(argument),
          )
        );

      case "IndexExpression":
        return (
          this.containsAssignment(expression.target) ||
          this.containsAssignment(expression.index)
        );

      case "AnonymousObjectLiteral":
        return expression.fields.some((field) =>
          this.containsAssignment(field.value),
        );

      case "TupleLiteral":
        return expression.members.some((member) =>
          this.containsAssignment(member),
        );

      case "ReturnExpression":
        return (
          expression.value !== null && this.containsAssignment(expression.value)
        );

      case "FunctionDeclaration":
        return expression.expressions.some((bodyExpression) =>
          this.containsAssignment(bodyExpression),
        );

      case "IntegerLiteral":
      case "StringLiteral":
      case "BooleanLiteral":
      case "NullLiteral":
      case "VariableReference":
        return false;
    }
  }
}
