// Phase 9

import {
  FunctionCall,
  FunctionDeclaration,
  Program,
  TypeAnnotation,
} from "../ast.js";
import { Environment } from "../environment.js";
import {
  NativeFunctionParameter,
  NativeFunctionValue,
  RuntimeValue,
} from "../runtime-value.js";
import { ArgumentBinder } from "./argument-binder.js";
import { ReturnSignal } from "./return-signal.js";

export abstract class FunctionEvaluator extends ArgumentBinder {
  protected registerFunctions(program: Program): void {
    for (const statement of program.statements) {
      if (statement.expression.type !== "FunctionDeclaration") {
        continue;
      }

      const declaration = statement.expression;
      const name = declaration.name.lexeme;

      if (this.functions.has(name)) {
        throw new Error(
          `Function '${name}' is already defined. at ` +
            `${declaration.name.line}:${declaration.name.column}`,
        );
      }

      if (this.findValue(this.environment, name) !== undefined) {
        throw new Error(
          `Name '${name}' is already defined. at ` +
            `${declaration.name.line}:${declaration.name.column}`,
        );
      }

      this.functions.set(name, declaration);
    }
  }

  protected evaluateFunctionCall(expression: FunctionCall): RuntimeValue {
    const localValue = this.findValue(
      this.currentEnvironment,
      expression.callee,
    );

    if (
      localValue !== undefined &&
      this.currentEnvironment !== this.environment
    ) {
      if (localValue.type !== "NativeFunction") {
        throw new Error(
          `Cannot call '${expression.callee}': value is not a function. at ` +
            `${expression.calleeToken.line}:${expression.calleeToken.column}`,
        );
      }

      return this.callNativeFunction(localValue, expression);
    }

    const globalValue = this.findValue(this.environment, expression.callee);

    if (globalValue !== undefined) {
      if (globalValue.type !== "NativeFunction") {
        throw new Error(
          `Cannot call '${expression.callee}': value is not a function. at ` +
            `${expression.calleeToken.line}:${expression.calleeToken.column}`,
        );
      }

      return this.callNativeFunction(globalValue, expression);
    }

    const declaration = this.functions.get(expression.callee);

    if (declaration === undefined) {
      throw new Error(
        `Undefined function '${expression.callee}'. at ` +
          `${expression.calleeToken.line}:${expression.calleeToken.column}`,
      );
    }

    return this.callFunction(declaration, expression);
  }

  protected callNativeFunction(
    nativeFunction: NativeFunctionValue,
    callExpression: FunctionCall,
  ): RuntimeValue {
    /*
     * Phase 8 native functions and older test fixtures do not necessarily
     * provide parameter metadata. Preserve positional native calls for those
     * functions while Phase 9 metadata-enabled natives support named arguments.
     */
    if (nativeFunction.parameters === undefined) {
      const argumentNames =
        callExpression.argumentNames ??
        callExpression.arguments.map(() => null);

      const namedArgument = argumentNames.find(
        (argumentName) => argumentName !== null,
      );

      if (namedArgument !== undefined && namedArgument !== null) {
        throw new Error(
          `Native function '${callExpression.callee}' does not declare ` +
            `named parameters. at ${namedArgument.line}:` +
            `${namedArgument.column}`,
        );
      }

      const arguments_ = callExpression.arguments.map((argument) =>
        this.evaluateExpression(argument),
      );

      return nativeFunction.call(arguments_);
    }

    const boundArguments = this.bindSuppliedArguments(
      callExpression.callee,
      nativeFunction.parameters,
      callExpression,
    );

    const arguments_: RuntimeValue[] = boundArguments.map((argument, index) => {
      if (argument !== undefined) {
        return argument;
      }

      const parameter = nativeFunction.parameters?.[index];

      throw new Error(
        `Native function '${callExpression.callee}' has no value for ` +
          `parameter '${parameter?.name ?? index}'. at ` +
          `${callExpression.calleeToken.line}:` +
          `${callExpression.calleeToken.column}`,
      );
    });

    return nativeFunction.call(arguments_);
  }

  protected callFunction(
    declaration: FunctionDeclaration,
    callExpression: FunctionCall,
  ): RuntimeValue {
    if (this.functionDepth >= FunctionEvaluator.MAX_FUNCTION_DEPTH) {
      throw new Error(
        "Maximum function call depth exceeded while calling " +
          `'${declaration.name.lexeme}'. at ` +
          `${callExpression.calleeToken.line}:` +
          `${callExpression.calleeToken.column}`,
      );
    }

    const parameterDefaults =
      declaration.parameterDefaults ?? declaration.parameters.map(() => null);

    const parameters: NativeFunctionParameter[] = declaration.parameters.map(
      (parameter, index) => ({
        name: parameter.lexeme,
        required: parameterDefaults[index] === null,
      }),
    );

    const boundArguments = this.bindSuppliedArguments(
      declaration.name.lexeme,
      parameters,
      callExpression,
    );

    for (let index = 0; index < declaration.parameters.length; index++) {
      if (boundArguments[index] !== undefined) {
        continue;
      }

      const defaultExpression = parameterDefaults[index];

      if (defaultExpression === null || defaultExpression === undefined) {
        const parameter = declaration.parameters[index]!;

        throw new Error(
          `Function '${declaration.name.lexeme}' is missing required argument ` +
            `'${parameter.lexeme}'. at ` +
            `${callExpression.calleeToken.line}:` +
            `${callExpression.calleeToken.column}`,
        );
      }

      boundArguments[index] = this.evaluateDefaultExpression(defaultExpression);
    }

    const previousEnvironment = this.currentEnvironment;
    const previousFunction = this.currentFunction;
    const previousParameterTypes = this.currentParameterTypes;
    const localEnvironment = new Environment();
    const parameterTypes = new Map<string, TypeAnnotation | null>();

    for (let index = 0; index < declaration.parameters.length; index++) {
      const parameter = declaration.parameters[index]!;
      const argument = boundArguments[index]!;
      const parameterType = declaration.parameterTypes?.[index] ?? null;

      this.assertParameterType(
        declaration,
        parameter,
        parameterType,
        argument,
        callExpression,
      );

      localEnvironment.define(parameter.lexeme, argument);
      parameterTypes.set(parameter.lexeme, parameterType);
    }

    this.currentEnvironment = localEnvironment;
    this.currentFunction = declaration;
    this.currentParameterTypes = parameterTypes;
    this.functionDepth++;

    try {
      const result = this.evaluateExpressionBlock(declaration.expressions);

      this.assertReturnType(declaration, result);

      return result;
    } catch (error) {
      if (error instanceof ReturnSignal) {
        this.assertReturnType(declaration, error.value);

        return error.value;
      }

      if (error instanceof RangeError) {
        throw new Error(
          "Maximum function call depth exceeded while calling " +
            `'${declaration.name.lexeme}'. at ` +
            `${callExpression.calleeToken.line}:` +
            `${callExpression.calleeToken.column}`,
        );
      }

      throw error;
    } finally {
      this.functionDepth--;
      this.currentEnvironment = previousEnvironment;
      this.currentFunction = previousFunction;
      this.currentParameterTypes = previousParameterTypes;
    }
  }
}
