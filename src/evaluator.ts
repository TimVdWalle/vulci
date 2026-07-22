// Phase 6

import {
  ComparisonChainExpression,
  ConditionalExpression,
  Expression,
  Program,
  Statement,
} from "./ast.js";
import { Environment } from "./environment.js";
import {
  FALSE_VALUE,
  IntegerValue,
  NULL_VALUE,
  RuntimeValue,
  TRUE_VALUE,
} from "./runtime-value.js";
import { Token, TokenType } from "./token.js";

export class Evaluator {
  constructor(private readonly environment: Environment) {}

  public evaluate(program: Program): RuntimeValue {
    let result: RuntimeValue = NULL_VALUE;

    for (const statement of program.statements) {
      result = this.evaluateStatement(statement);
    }

    return result;
  }

  private evaluateStatement(statement: Statement): RuntimeValue {
    switch (statement.type) {
      case "ExpressionStatement":
        return this.evaluateExpression(statement.expression);
    }
  }

  private evaluateExpression(expression: Expression): RuntimeValue {
    switch (expression.type) {
      case "IntegerLiteral": {
        const value: IntegerValue = {
          type: "Integer",
          value: expression.value,
        };

        return value;
      }

      case "BooleanLiteral":
        return expression.value ? TRUE_VALUE : FALSE_VALUE;

      case "NullLiteral":
        return NULL_VALUE;

      case "VariableReference":
        return this.environment.get(expression.name);

      case "AssignmentExpression": {
        const value = this.evaluateExpression(expression.value);

        this.environment.define(expression.name, value);

        return value;
      }

      case "FunctionCall": {
        const callee = this.environment.get(expression.callee);

        if (callee.type !== "NativeFunction") {
          throw new Error(`'${expression.callee}' is not callable.`);
        }

        const arguments_ = expression.arguments.map((argument) =>
          this.evaluateExpression(argument),
        );

        return callee.call(arguments_);
      }

      case "UnaryExpression":
        return this.evaluateUnaryExpression(
          expression.operator,
          this.evaluateExpression(expression.operand),
        );

      case "BinaryExpression":
        if (
          expression.operator.type === TokenType.And ||
          expression.operator.type === TokenType.Or
        ) {
          return this.evaluateLogicalExpression(
            expression.operator,
            expression.left,
            expression.right,
          );
        }

        return this.evaluateBinaryExpression(
          expression.operator,
          this.evaluateExpression(expression.left),
          this.evaluateExpression(expression.right),
        );

      case "ComparisonChainExpression":
        return this.evaluateComparisonChain(expression);

      case "ConditionalExpression":
        return this.evaluateConditionalExpression(expression);
    }
  }

  private evaluateConditionalExpression(
    expression: ConditionalExpression,
  ): RuntimeValue {
    for (const branch of expression.branches) {
      const condition = this.evaluateExpression(branch.condition);

      if (condition.type !== "Boolean") {
        throw new Error(
          "Conditional expression requires a Boolean condition. " +
            `at ${branch.keyword.line}:${branch.keyword.column}`,
        );
      }

      if (condition.value) {
        return this.evaluateExpressionBlock(branch.expressions);
      }
    }

    if (expression.elseExpressions !== null) {
      return this.evaluateExpressionBlock(expression.elseExpressions);
    }

    return NULL_VALUE;
  }

  private evaluateExpressionBlock(expressions: Expression[]): RuntimeValue {
    let result: RuntimeValue = NULL_VALUE;

    for (const expression of expressions) {
      result = this.evaluateExpression(expression);
    }

    return result;
  }

  private evaluateComparisonChain(
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

  private evaluateChainedComparison(
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

      case "Boolean":
        return right.type === "Boolean" && left.value === right.value;

      case "Null":
        return right.type === "Null";

      case "NativeFunction":
        return left === right;
    }
  }

  private evaluateUnaryExpression(
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

  private evaluateLogicalExpression(
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

  private evaluateBinaryExpression(
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
            `Division by zero at ` + `${operator.line}:${operator.column}`,
          );
        }

        result = Math.trunc(leftInteger.value / rightInteger.value);
        break;

      case TokenType.Percent:
        if (rightInteger.value === 0) {
          throw new Error(
            `Remainder by zero at ` + `${operator.line}:${operator.column}`,
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

  private valuesEqual(
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

  private evaluateOrderingComparison(
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

  private createBoolean(
    value: boolean,
  ): typeof TRUE_VALUE | typeof FALSE_VALUE {
    return value ? TRUE_VALUE : FALSE_VALUE;
  }

  private runtimeTypeName(value: RuntimeValue): string {
    return value.type.toLowerCase();
  }

  private requireInteger(value: RuntimeValue, operator: Token): IntegerValue {
    if (value.type !== "Integer") {
      throw new Error(
        `Operator '${operator.lexeme}' requires Integer operands at ` +
          `${operator.line}:${operator.column}`,
      );
    }

    return value;
  }

  private createInteger(value: number, operator: Token): IntegerValue {
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
