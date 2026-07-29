// Phase 9

import { Expression, FunctionCall, TypeAnnotation } from "../ast.js";
import { NativeFunctionParameter, RuntimeValue } from "../runtime-value.js";
import { OperatorEvaluator } from "./operator-evaluator.js";

export abstract class ArgumentBinder extends OperatorEvaluator {
  protected bindSuppliedArguments(
    functionName: string,
    parameters: NativeFunctionParameter[],
    callExpression: FunctionCall,
  ): (RuntimeValue | undefined)[] {
    const argumentNames =
      callExpression.argumentNames ?? callExpression.arguments.map(() => null);

    const parameterIndexes = new Map<string, number>();

    const boundArguments: (RuntimeValue | undefined)[] = parameters.map(
      () => undefined,
    );

    let positionalIndex = 0;

    parameters.forEach((parameter, index) => {
      parameterIndexes.set(parameter.name, index);
    });

    for (let index = 0; index < callExpression.arguments.length; index++) {
      const argumentExpression = callExpression.arguments[index]!;
      const argumentName = argumentNames[index] ?? null;

      const value = this.evaluateExpression(argumentExpression);

      let parameterIndex: number;

      if (argumentName === null) {
        if (positionalIndex >= 2) {
          throw new Error(
            `Function '${functionName}' accepts at most two positional ` +
              `arguments. at ${callExpression.calleeToken.line}:` +
              `${callExpression.calleeToken.column}`,
          );
        }

        parameterIndex = positionalIndex;
        positionalIndex++;

        const parameter = parameters[parameterIndex];

        if (parameter === undefined) {
          throw new Error(
            `Function '${functionName}' received too many positional ` +
              `arguments. at ${callExpression.calleeToken.line}:` +
              `${callExpression.calleeToken.column}`,
          );
        }

        if (!parameter.required) {
          throw new Error(
            `Optional argument '${parameter.name}' of function ` +
              `'${functionName}' must be named. at ` +
              `${callExpression.calleeToken.line}:` +
              `${callExpression.calleeToken.column}`,
          );
        }
      } else {
        const matchedIndex = parameterIndexes.get(argumentName.lexeme);

        if (matchedIndex === undefined) {
          throw new Error(
            `Function '${functionName}' has no parameter named ` +
              `'${argumentName.lexeme}'. at ${argumentName.line}:` +
              `${argumentName.column}`,
          );
        }

        parameterIndex = matchedIndex;
      }

      if (boundArguments[parameterIndex] !== undefined) {
        const parameter = parameters[parameterIndex]!;

        throw new Error(
          `Argument '${parameter.name}' is supplied more than once to ` +
            `function '${functionName}'. at ` +
            `${callExpression.calleeToken.line}:` +
            `${callExpression.calleeToken.column}`,
        );
      }

      boundArguments[parameterIndex] = value;
    }

    for (let index = 0; index < parameters.length; index++) {
      const parameter = parameters[index]!;

      if (parameter.required && boundArguments[index] === undefined) {
        throw new Error(
          `Function '${functionName}' is missing required argument ` +
            `'${parameter.name}'. at ${callExpression.calleeToken.line}:` +
            `${callExpression.calleeToken.column}`,
        );
      }
    }

    return boundArguments;
  }

  protected evaluateDefaultExpression(expression: Expression): RuntimeValue {
    const previousEnvironment = this.currentEnvironment;
    const previousFunction = this.currentFunction;
    const previousParameterTypes = this.currentParameterTypes;

    this.currentEnvironment = this.environment;
    this.currentFunction = null;
    this.currentParameterTypes = new Map<string, TypeAnnotation | null>();

    try {
      return this.evaluateExpression(expression);
    } finally {
      this.currentEnvironment = previousEnvironment;
      this.currentFunction = previousFunction;
      this.currentParameterTypes = previousParameterTypes;
    }
  }
}
