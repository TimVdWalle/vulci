import { Expression, Program, Statement } from "./ast.js";
import { Environment } from "./environment.js";
import { IntegerValue, NULL_VALUE, RuntimeValue } from "./runtime-value.js";

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
    }
  }
}
