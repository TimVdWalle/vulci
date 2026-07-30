// Phase 12

import { ComparisonChainExpression } from "../ast.js";
import { FALSE_VALUE, RuntimeValue, TRUE_VALUE } from "../runtime-value.js";
import { Token, TokenType } from "../token.js";
import { StringEvaluator } from "./string-evaluator.js";

function booleanValue(value: boolean): typeof TRUE_VALUE | typeof FALSE_VALUE {
  return value ? TRUE_VALUE : FALSE_VALUE;
}

export abstract class ComparisonEvaluator extends StringEvaluator {
  protected evaluateComparisonChain(
    expression: ComparisonChainExpression,
  ): RuntimeValue {
    let left = this.evaluateExpression(expression.operands[0]!);

    for (let index = 0; index < expression.operators.length; index++) {
      const operator = expression.operators[index]!;
      const right = this.evaluateExpression(expression.operands[index + 1]!);
      const comparison = this.evaluateChainedComparison(operator, left, right);

      if (!comparison.value) return FALSE_VALUE;
      left = right;
    }

    return TRUE_VALUE;
  }

  private evaluateChainedComparison(
    operator: Token,
    left: RuntimeValue,
    right: RuntimeValue,
  ): typeof TRUE_VALUE | typeof FALSE_VALUE {
    if (operator.type === TokenType.EqualEqual) {
      return booleanValue(this.valuesEqualForChain(left, right, operator));
    }

    if (operator.type === TokenType.BangEqual) {
      return booleanValue(!this.valuesEqualForChain(left, right, operator));
    }

    if (!(
      (left.type === "Integer" && right.type === "Integer") ||
      (left.type === "String" && right.type === "String")
    )) {
      throw new Error(
        "Invalid operand type in chained comparison: " +
          `operator '${operator.lexeme}' requires two integers or two strings. ` +
          `at ${operator.line}:${operator.column}`,
      );
    }

    switch (operator.type) {
      case TokenType.Less:
        return booleanValue(left.value < right.value);
      case TokenType.LessEqual:
        return booleanValue(left.value <= right.value);
      case TokenType.Greater:
        return booleanValue(left.value > right.value);
      case TokenType.GreaterEqual:
        return booleanValue(left.value >= right.value);
      default:
        throw new Error(
          `Unsupported chained-comparison operator '${operator.lexeme}' at ` +
            `${operator.line}:${operator.column}`,
        );
    }
  }

  private valuesEqualForChain(
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
      case "String":
        return right.type === "String" && left.value === right.value;
      case "Boolean":
        return right.type === "Boolean" && left.value === right.value;
      case "Null":
        return right.type === "Null";
      case "Tuple":
      case "AnonymousObject":
        throw new Error(
          "Invalid operand type in chained comparison: " +
            `operator '${operator.lexeme}' does not support compound values. at ` +
            `${operator.line}:${operator.column}`,
        );
      case "NativeFunction":
        return left === right;
    }
  }
}
