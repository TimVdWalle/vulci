// Phase 8

import {
  ComparisonChainExpression,
  ConditionalExpression,
  Expression,
  FunctionCall,
  FunctionDeclaration,
  Program,
  Statement,
  TypeAnnotation,
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

class ReturnSignal {
  constructor(public readonly value: RuntimeValue) {}
}

export class Evaluator {
  private static readonly MAX_FUNCTION_DEPTH = 1_000;

  private readonly functions = new Map<string, FunctionDeclaration>();

  private currentEnvironment: Environment;

  private functionDepth = 0;

  private currentFunction: FunctionDeclaration | null = null;

  private currentParameterTypes = new Map<string, TypeAnnotation | null>();

  constructor(private readonly environment: Environment) {
    this.currentEnvironment = environment;
  }

  public evaluate(program: Program): RuntimeValue {
    this.registerFunctions(program);

    let result: RuntimeValue = NULL_VALUE;

    for (const statement of program.statements) {
      result = this.evaluateStatement(statement);
    }

    return result;
  }

  private registerFunctions(program: Program): void {
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
        return this.getVariable(expression.name);

      case "AssignmentExpression": {
        const value = this.evaluateExpression(expression.value);

        this.assignVariable(expression.name, value);

        return value;
      }

      case "FunctionDeclaration":
        return NULL_VALUE;

      case "FunctionCall":
        return this.evaluateFunctionCall(expression);

      case "ReturnExpression": {
        if (this.functionDepth === 0) {
          throw new Error(
            `'return' can only be used inside a function. at ` +
              `${expression.keyword.line}:${expression.keyword.column}`,
          );
        }

        const value =
          expression.value === null
            ? NULL_VALUE
            : this.evaluateExpression(expression.value);

        throw new ReturnSignal(value);
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

  private evaluateFunctionCall(expression: FunctionCall): RuntimeValue {
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

      const arguments_ = this.evaluateArguments(expression);

      return localValue.call(arguments_);
    }

    const globalValue = this.findValue(this.environment, expression.callee);

    if (globalValue !== undefined) {
      if (globalValue.type !== "NativeFunction") {
        throw new Error(
          `Cannot call '${expression.callee}': value is not a function. at ` +
            `${expression.calleeToken.line}:${expression.calleeToken.column}`,
        );
      }

      const arguments_ = this.evaluateArguments(expression);

      return globalValue.call(arguments_);
    }

    const declaration = this.functions.get(expression.callee);

    if (declaration === undefined) {
      throw new Error(
        `Undefined function '${expression.callee}'. at ` +
          `${expression.calleeToken.line}:${expression.calleeToken.column}`,
      );
    }

    const arguments_ = this.evaluateArguments(expression);

    return this.callFunction(declaration, arguments_, expression);
  }

  private evaluateArguments(expression: FunctionCall): RuntimeValue[] {
    const arguments_: RuntimeValue[] = [];

    for (const argument of expression.arguments) {
      arguments_.push(this.evaluateExpression(argument));
    }

    return arguments_;
  }

  private callFunction(
    declaration: FunctionDeclaration,
    arguments_: RuntimeValue[],
    callExpression: FunctionCall,
  ): RuntimeValue {
    if (arguments_.length !== declaration.parameters.length) {
      throw new Error(
        `Function '${declaration.name.lexeme}' expects ` +
          `${declaration.parameters.length} argument(s), but received ` +
          `${arguments_.length}. at ` +
          `${callExpression.calleeToken.line}:` +
          `${callExpression.calleeToken.column}`,
      );
    }

    if (this.functionDepth >= Evaluator.MAX_FUNCTION_DEPTH) {
      throw new Error(
        "Maximum function call depth exceeded while calling " +
          `'${declaration.name.lexeme}'. at ` +
          `${callExpression.calleeToken.line}:` +
          `${callExpression.calleeToken.column}`,
      );
    }

    const previousEnvironment = this.currentEnvironment;
    const previousFunction = this.currentFunction;
    const previousParameterTypes = this.currentParameterTypes;
    const localEnvironment = new Environment();
    const parameterTypes = new Map<string, TypeAnnotation | null>();

    for (let index = 0; index < declaration.parameters.length; index++) {
      const parameter = declaration.parameters[index]!;
      const argument = arguments_[index]!;
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

  private getVariable(name: string): RuntimeValue {
    if (name.startsWith("$")) {
      return this.environment.get(name);
    }

    return this.currentEnvironment.get(name);
  }

  private assignVariable(name: string, value: RuntimeValue): void {
    if (name.startsWith("$")) {
      if (
        this.currentEnvironment !== this.environment &&
        this.findValue(this.environment, name) === undefined
      ) {
        throw new Error(
          `Global variable '${name}' must be declared at the top level ` +
            "before it can be assigned inside a function.",
        );
      }

      this.environment.define(name, value);

      return;
    }

    if (
      this.currentEnvironment === this.environment &&
      this.functions.has(name)
    ) {
      throw new Error(`Name '${name}' is already defined as a function.`);
    }

    const parameterType = this.currentParameterTypes.get(name);

    if (parameterType !== undefined && parameterType !== null) {
      if (!this.valueMatchesType(value, parameterType)) {
        const declaration = this.currentFunction;
        const parameter = declaration?.parameters.find(
          (candidate) => candidate.lexeme === name,
        );

        throw new Error(
          `Cannot assign ${this.runtimeTypeName(value)} to parameter '${name}' ` +
            `of function '${declaration?.name.lexeme ?? "<unknown>"}': expected ` +
            `${this.typeAnnotationName(parameterType)}. at ` +
            `${parameter?.line ?? 0}:${parameter?.column ?? 0}`,
        );
      }
    }

    this.currentEnvironment.define(name, value);
  }

  private assertParameterType(
    declaration: FunctionDeclaration,
    parameter: Token,
    parameterType: TypeAnnotation | null,
    value: RuntimeValue,
    callExpression: FunctionCall,
  ): void {
    if (parameterType === null || this.valueMatchesType(value, parameterType)) {
      return;
    }

    throw new Error(
      `Function '${declaration.name.lexeme}' parameter '${parameter.lexeme}' ` +
        `expects ${this.typeAnnotationName(parameterType)}, but received ` +
        `${this.runtimeTypeName(value)}. at ` +
        `${callExpression.calleeToken.line}:${callExpression.calleeToken.column}`,
    );
  }

  private assertReturnType(
    declaration: FunctionDeclaration,
    value: RuntimeValue,
  ): void {
    if (
      declaration.returnType === undefined ||
      this.valueMatchesType(value, declaration.returnType)
    ) {
      return;
    }

    const location = declaration.returnType.members[0] ?? declaration.name;

    throw new Error(
      `Function '${declaration.name.lexeme}' expects return type ` +
        `${this.typeAnnotationName(declaration.returnType)}, but returned ` +
        `${this.runtimeTypeName(value)}. at ${location.line}:${location.column}`,
    );
  }

  private valueMatchesType(
    value: RuntimeValue,
    annotation: TypeAnnotation,
  ): boolean {
    return annotation.members.some((member) => {
      switch (member.lexeme) {
        case "any":
          return true;

        case "int":
          return value.type === "Integer";

        case "bool":
          return value.type === "Boolean";

        case "null":
          return value.type === "Null";

        case "str":
        case "list":
        case "set":
        case "map":
          return false;

        default:
          return false;
      }
    });
  }

  private typeAnnotationName(annotation: TypeAnnotation): string {
    return annotation.members.map((member) => member.lexeme).join("|");
  }

  private findValue(
    environment: Environment,
    name: string,
  ): RuntimeValue | undefined {
    try {
      return environment.get(name);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === `Undefined variable '${name}'.`
      ) {
        return undefined;
      }

      throw error;
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
