// Phase 14

import { Expression, MemberAccess, MemberCall } from "../ast.js";
import { EnumValue } from "../runtime-value.js";
import { Token } from "../token.js";
import { ScopeResolver } from "./scope-resolver.js";

export abstract class EnumEvaluator extends ScopeResolver {
  protected evaluateEnumMemberAccess(
    expression: MemberAccess,
  ): EnumValue | null {
    const enumName = this.enumQualifierName(expression.receiver);

    if (enumName === null) return null;

    const declaration = this.enums.get(enumName)!;
    const member = declaration.members.find(
      (candidate) => candidate.lexeme === expression.member.lexeme,
    );

    if (member === undefined) {
      throw this.unknownEnumMemberError(enumName, expression.member);
    }

    return {
      type: "Enum",
      enumName,
      memberName: member.lexeme,
    };
  }

  protected rejectEnumMemberCall(expression: MemberCall): void {
    const enumName = this.enumQualifierName(expression.receiver);

    if (enumName === null) return;

    const declaration = this.enums.get(enumName)!;
    const member = declaration.members.find(
      (candidate) => candidate.lexeme === expression.member.lexeme,
    );

    if (member === undefined) {
      throw this.unknownEnumMemberError(enumName, expression.member);
    }

    throw new Error(
      `E_MEM_TYPE: Enum member '${enumName}.${member.lexeme}' is a value and ` +
        `cannot be called. at ${expression.member.line}:` +
        `${expression.member.column}`,
    );
  }

  protected rejectEnumMemberAssignment(target: MemberAccess): void {
    const enumName = this.enumQualifierName(target.receiver);

    if (enumName === null) return;

    const declaration = this.enums.get(enumName)!;
    const member = declaration.members.find(
      (candidate) => candidate.lexeme === target.member.lexeme,
    );

    if (member === undefined) {
      throw this.unknownEnumMemberError(enumName, target.member);
    }

    throw new Error(
      `E_MEM_TYPE: Enum member '${enumName}.${member.lexeme}' is not mutable. ` +
        `at ${target.member.line}:${target.member.column}`,
    );
  }

  private enumQualifierName(expression: Expression): string | null {
    if (
      expression.type === "VariableReference" &&
      this.enums.has(expression.name)
    ) {
      return expression.name;
    }

    return null;
  }

  private unknownEnumMemberError(enumName: string, member: Token): Error {
    return new Error(
      `E_MEM_UNKNOWN: Enum '${enumName}' has no member '${member.lexeme}'. ` +
        `at ${member.line}:${member.column}`,
    );
  }
}
