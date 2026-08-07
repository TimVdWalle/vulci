// Phase 14

import {
  EnumDeclaration,
  Expression,
  FunctionDeclaration,
  StructDeclaration,
  TypeAnnotation,
} from "../ast.js";
import { Environment } from "../environment.js";
import { RuntimeValue, StructValue } from "../runtime-value.js";

export type DefaultEvaluationContext = "function" | "struct" | null;

export abstract class EvaluatorContext {
  protected static readonly MAX_FUNCTION_DEPTH = 1_000;

  protected readonly functions = new Map<string, FunctionDeclaration>();
  protected readonly structs = new Map<string, StructDeclaration>();
  protected readonly enums = new Map<string, EnumDeclaration>();
  protected currentEnvironment: Environment;
  protected functionDepth = 0;
  protected currentFunction: FunctionDeclaration | null = null;
  protected currentParameterTypes = new Map<string, TypeAnnotation | null>();
  protected currentSelf: StructValue | null = null;
  protected defaultEvaluationContext: DefaultEvaluationContext = null;

  constructor(protected readonly environment: Environment) {
    this.currentEnvironment = environment;
  }

  protected abstract evaluateExpression(expression: Expression): RuntimeValue;
  protected abstract evaluateDefaultExpression(
    expression: Expression,
    context?: "function" | "struct",
  ): RuntimeValue;
  protected abstract evaluateExpressionBlock(
    expressions: Expression[],
  ): RuntimeValue;
}
