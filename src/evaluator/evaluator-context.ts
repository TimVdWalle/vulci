// Phase 9

import { Expression, FunctionDeclaration, TypeAnnotation } from "../ast.js";
import { Environment } from "../environment.js";
import { RuntimeValue } from "../runtime-value.js";

export abstract class EvaluatorContext {
  protected static readonly MAX_FUNCTION_DEPTH = 1_000;

  protected readonly functions = new Map<string, FunctionDeclaration>();
  protected currentEnvironment: Environment;
  protected functionDepth = 0;
  protected currentFunction: FunctionDeclaration | null = null;
  protected currentParameterTypes = new Map<string, TypeAnnotation | null>();

  constructor(protected readonly environment: Environment) {
    this.currentEnvironment = environment;
  }

  protected abstract evaluateExpression(expression: Expression): RuntimeValue;
  protected abstract evaluateExpressionBlock(
    expressions: Expression[],
  ): RuntimeValue;
}
