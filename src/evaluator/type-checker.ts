// Phase 9

import { FunctionCall, FunctionDeclaration, TypeAnnotation } from "../ast.js";
import { RuntimeValue } from "../runtime-value.js";
import { Token } from "../token.js";
import { EvaluatorContext } from "./evaluator-context.js";

export abstract class TypeChecker extends EvaluatorContext {
  protected assertParameterType(
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

  protected assertReturnType(
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

  protected valueMatchesType(
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

  protected typeAnnotationName(annotation: TypeAnnotation): string {
    return annotation.members.map((member) => member.lexeme).join("|");
  }

  protected runtimeTypeName(value: RuntimeValue): string {
    return value.type.toLowerCase();
  }
}
