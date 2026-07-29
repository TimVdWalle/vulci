// Phase 9

import { ComparisonChainExpression, Expression } from "../ast.js";
import {
  FALSE_VALUE,
  IntegerValue,
  RuntimeValue,
  TRUE_VALUE,
} from "../runtime-value.js";
import { Token, TokenType } from "../token.js";
import { ScopeResolver } from "./scope-resolver.js";

export abstract class OperatorEvaluator extends ScopeResolver {
  protected evaluateComparisonChain(
    expression: ComparisonChainExpression,
  ): RuntimeValue {
    let left = this.evaluateExpression(expression.operands[0]!);

    for (let index = 0; index < expression.operators.length; index++) {
      const operator = expression.operators[index]!;

      const right = this.evaluateExpression(expression.operands[index + 1]!);

      const comparison = this.evaluateChainedComparison(operator, left, right);

      if (!comparison.value) {
        return FALSE_VALUE;
      }

      left = right;
    }

    return TRUE_VALUE;
  }

  protected evaluateChainedComparison(
    operator: Token,
    left: RuntimeValue,
    right: RuntimeValue,
  ): typeof TRUE_VALUE | typeof FALSE_VALUE {
    switch (operator.type) {
      case TokenType.EqualEqual:
        return this.createBoolean(
          this.valuesEqualForChain(left, right, operator),
        );

      case TokenType.BangEqual:
        return this.createBoolean(
          !this.valuesEqualForChain(left, right, operator),
        );

      case TokenType.Less:
      case TokenType.LessEqual:
      case TokenType.Greater:
      case TokenType.GreaterEqual:
        if (left.type !== "Integer" || right.type !== "Integer") {
          throw new Error(
            "Invalid operand type in chained comparison: " +
              `operator '${operator.lexeme}' requires integer operands. ` +
              `at ${operator.line}:${operator.column}`,
          );
        }

        switch (operator.type) {
          case TokenType.Less:
            return this.createBoolean(left.value < right.value);

          case TokenType.LessEqual:
            return this.createBoolean(left.value <= right.value);

          case TokenType.Greater:
            return this.createBoolean(left.value > right.value);

          case TokenType.GreaterEqual:
            return this.createBoolean(left.value >= right.value);
        }
    }

    throw new Error(
      `Unsupported chained-comparison operator '${operator.lexeme}' at ` +
        `${operator.line}:${operator.column}`,
    );
  }

  protected valuesEqualForChain(
    left: RuntimeValue,
    right: RuntimeValue,
    operator: Token,
  ): boolean {
    if (left.type !== right.type) {
      throw new Error(
        "Invalid operand type in chained comparison: " +
          `operator '${operator.lexeme}' requires operands of the same type. ` +
          `at ${operator.line}:${operator.column}`,
      );
    }

    switch (left.type) {
      case "Integer":
        return right.type === "Integer" && left.value === right.value;

      case "Boolean":
        return right.type === "Boolean" && left.value === right.value;

      case "Null":
        return right.type === "Null";

      case "NativeFunction":
        return left === right;
    }
  }

  protected evaluateUnaryExpression(
    operator: Token,
    operand: RuntimeValue,
  ): RuntimeValue {
    switch (operator.type) {
      case TokenType.Minus: {
        const integer = this.requireInteger(operand, operator);

        return this.createInteger(-integer.value, operator);
      }

      case TokenType.Not:
        if (operand.type !== "Boolean") {
          throw new Error(
            `Operator 'not' requires a boolean operand, but ` +
              `the operand is ${this.runtimeTypeName(operand)}. ` +
              `at ${operator.line}:${operator.column}`,
          );
        }

        return this.createBoolean(!operand.value);

      default:
        throw new Error(
          `Unsupported unary operator '${operator.lexeme}' at ` +
            `${operator.line}:${operator.column}`,
        );
    }
  }

  protected evaluateLogicalExpression(
    operator: Token,
    leftExpression: Expression,
    rightExpression: Expression,
  ): RuntimeValue {
    const left = this.evaluateExpression(leftExpression);

    if (left.type !== "Boolean") {
      throw new Error(
        `Operator '${operator.lexeme}' requires boolean operands, ` +
          `but the left operand is ${this.runtimeTypeName(left)}. ` +
          `at ${operator.line}:${operator.column}`,
      );
    }

    if (operator.type === TokenType.And && !left.value) {
      return FALSE_VALUE;
    }

    if (operator.type === TokenType.Or && left.value) {
      return TRUE_VALUE;
    }

    const right = this.evaluateExpression(rightExpression);

    if (right.type !== "Boolean") {
      throw new Error(
        `Operator '${operator.lexeme}' requires boolean operands, ` +
          `but the right operand is ${this.runtimeTypeName(right)}. ` +
          `at ${operator.line}:${operator.column}`,
      );
    }

    switch (operator.type) {
      case TokenType.And:
        return this.createBoolean(left.value && right.value);

      case TokenType.Or:
        return this.createBoolean(left.value || right.value);

      default:
        throw new Error(
          `Unsupported logical operator '${operator.lexeme}' at ` +
            `${operator.line}:${operator.column}`,
        );
    }
  }

  protected evaluateBinaryExpression(
    operator: Token,
    left: RuntimeValue,
    right: RuntimeValue,
  ): RuntimeValue {
    switch (operator.type) {
      case TokenType.EqualEqual:
        return this.createBoolean(this.valuesEqual(left, right, operator));

      case TokenType.BangEqual:
        return this.createBoolean(!this.valuesEqual(left, right, operator));

      case TokenType.Less:
      case TokenType.LessEqual:
      case TokenType.Greater:
      case TokenType.GreaterEqual:
        return this.evaluateOrderingComparison(operator, left, right);
    }

    const leftInteger = this.requireInteger(left, operator);
    const rightInteger = this.requireInteger(right, operator);

    let result: number;

    switch (operator.type) {
      case TokenType.Plus:
        result = leftInteger.value + rightInteger.value;
        break;

      case TokenType.Minus:
        result = leftInteger.value - rightInteger.value;
        break;

      case TokenType.Star:
        result = leftInteger.value * rightInteger.value;
        break;

      case TokenType.Slash:
        if (rightInteger.value === 0) {
          throw new Error(
            `Division by zero at ${operator.line}:${operator.column}`,
          );
        }

        result = Math.trunc(leftInteger.value / rightInteger.value);
        break;

      case TokenType.Percent:
        if (rightInteger.value === 0) {
          throw new Error(
            `Remainder by zero at ${operator.line}:${operator.column}`,
          );
        }

        result = leftInteger.value % rightInteger.value;
        break;

      default:
        throw new Error(
          `Unsupported binary operator '${operator.lexeme}' at ` +
            `${operator.line}:${operator.column}`,
        );
    }

    return this.createInteger(result, operator);
  }

  protected valuesEqual(
    left: RuntimeValue,
    right: RuntimeValue,
    operator: Token,
  ): boolean {
    if (left.type === "Integer" && right.type === "Integer") {
      return left.value === right.value;
    }

    if (left.type === "Boolean" && right.type === "Boolean") {
      return left.value === right.value;
    }

    if (left.type === "Null" && right.type === "Null") {
      return true;
    }

    throw new Error(
      `Operator '${operator.lexeme}' requires operands ` +
        `of the same type. at ` +
        `${operator.line}:${operator.column}`,
    );
  }

  protected evaluateOrderingComparison(
    operator: Token,
    left: RuntimeValue,
    right: RuntimeValue,
  ): RuntimeValue {
    if (left.type !== "Integer" || right.type !== "Integer") {
      throw new Error(
        `Operator '${operator.lexeme}' requires integer ` +
          `operands. at ` +
          `${operator.line}:${operator.column}`,
      );
    }

    switch (operator.type) {
      case TokenType.Less:
        return this.createBoolean(left.value < right.value);

      case TokenType.LessEqual:
        return this.createBoolean(left.value <= right.value);

      case TokenType.Greater:
        return this.createBoolean(left.value > right.value);

      case TokenType.GreaterEqual:
        return this.createBoolean(left.value >= right.value);

      default:
        throw new Error(
          `Unsupported ordering operator '${operator.lexeme}' at ` +
            `${operator.line}:${operator.column}`,
        );
    }
  }

  protected createBoolean(
    value: boolean,
  ): typeof TRUE_VALUE | typeof FALSE_VALUE {
    return value ? TRUE_VALUE : FALSE_VALUE;
  }

  protected requireInteger(value: RuntimeValue, operator: Token): IntegerValue {
    if (value.type !== "Integer") {
      throw new Error(
        `Operator '${operator.lexeme}' requires Integer operands at ` +
          `${operator.line}:${operator.column}`,
      );
    }

    return value;
  }

  protected createInteger(value: number, operator: Token): IntegerValue {
    if (!Number.isSafeInteger(value)) {
      throw new Error(
        `Integer arithmetic result is outside the supported range at ` +
          `${operator.line}:${operator.column}`,
      );
    }

    return {
      type: "Integer",
      value,
    };
  }
}
