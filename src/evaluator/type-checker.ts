// Phase 13

import {
  FunctionCall,
  FunctionDeclaration,
  TypeAnnotation,
  TypeMember,
} from "../ast.js";
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
    if (parameterType === null || this.valueMatchesType(value, parameterType))
      return;
    throw new Error(
      `Function '${declaration.name.lexeme}' parameter '${parameter.lexeme}' ` +
        `expects ${this.typeAnnotationName(parameterType)}, but received ` +
        `${this.runtimeTypeName(value)}. at ${callExpression.calleeToken.line}:` +
        `${callExpression.calleeToken.column}`,
    );
  }

  protected assertReturnType(
    declaration: FunctionDeclaration,
    value: RuntimeValue,
  ): void {
    if (
      declaration.returnType === undefined ||
      this.valueMatchesType(value, declaration.returnType)
    )
      return;
    const location =
      declaration.returnType.members[0]?.token ?? declaration.name;
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
    return annotation.members.some((member) =>
      this.valueMatchesMember(value, member),
    );
  }

  private valueMatchesMember(value: RuntimeValue, member: TypeMember): boolean {
    if (member.type === "TupleType") {
      return (
        value.type === "Tuple" &&
        value.members.length === member.members.length &&
        value.members.every((item, index) =>
          this.valueMatchesType(item, member.members[index]!),
        )
      );
    }

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
        return value.type === "String";
      case "list":
      case "set":
      case "map":
        return false;
      default:
        return value.type === "Struct" && value.name === member.lexeme;
    }
  }

  protected typeAnnotationName(annotation: TypeAnnotation): string {
    return annotation.members
      .map((member) => this.typeMemberName(member))
      .join("|");
  }

  private typeMemberName(member: TypeMember): string {
    if (member.type === "NamedType") return member.lexeme;
    return `tuple(${member.members.map((item) => this.typeAnnotationName(item)).join(", ")})`;
  }

  protected runtimeTypeName(value: RuntimeValue): string {
    return value.type === "Struct" ? value.name : value.type.toLowerCase();
  }
}
