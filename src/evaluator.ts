import { Expression, Program, Statement } from "./ast.js";
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
      case "VariableAssignment": {
        const value = this.evaluateExpression(statement.value);

        this.environment.define(statement.name, value);

        return value;
      }

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

      case "VariableReference":
        return this.environment.get(expression.name);

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
        return this.evaluateBinaryExpression(
          expression.operator,
          this.evaluateExpression(expression.left),
          this.evaluateExpression(expression.right),
        );
    }
  }

  private evaluateUnaryExpression(
    operator: Token,
    operand: RuntimeValue,
  ): RuntimeValue {
    const integer = this.requireInteger(operand, operator);

    switch (operator.type) {
      case TokenType.Minus:
        return this.createInteger(-integer.value, operator);

      default:
        throw new Error(
          `Unsupported unary operator '${operator.lexeme}' at ` +
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

  private createBoolean(value: boolean): RuntimeValue {
    return value ? TRUE_VALUE : FALSE_VALUE;
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
