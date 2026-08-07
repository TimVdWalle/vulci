// Phase 14

import {
  Expression,
  FunctionDeclaration,
  MemberAccess,
  StructConstruction,
  StructDeclaration,
  StructFieldDeclaration,
} from "../ast.js";
import { RuntimeValue, StructValue } from "../runtime-value.js";
import { EnumEvaluator } from "./enum-evaluator.js";
import { copyRuntimeValue } from "./value-copy.js";

export abstract class StructEvaluator extends EnumEvaluator {
  protected evaluateStructConstruction(
    expression: StructConstruction,
  ): StructValue {
    const declaration = this.structs.get(expression.constructor.lexeme);

    if (declaration === undefined) {
      throw new Error(
        `Undefined struct constructor '${expression.constructor.lexeme}'. at ` +
          `${expression.constructor.line}:${expression.constructor.column}`,
      );
    }

    const suppliedFields = this.validateConstructionShape(
      declaration,
      expression,
    );
    const values = new Map<string, RuntimeValue>();

    for (const supplied of expression.fields) {
      const field = declaration.fields.find(
        (candidate) => candidate.name.lexeme === supplied.name.lexeme,
      )!;
      const value = this.evaluateExpression(supplied.value);

      this.assertStructFieldType(declaration, field, value, supplied.name);
      values.set(field.name.lexeme, copyRuntimeValue(value));
    }

    for (const field of declaration.fields) {
      if (suppliedFields.has(field.name.lexeme)) continue;

      const defaultValue = field.defaultValue!;
      const value = this.evaluateDefaultExpression(defaultValue, "struct");

      this.assertStructFieldType(declaration, field, value, field.name);
      values.set(field.name.lexeme, copyRuntimeValue(value));
    }

    return {
      type: "Struct",
      name: declaration.name.lexeme,
      fields: declaration.fields.map((field) => ({
        name: field.name.lexeme,
        value: values.get(field.name.lexeme)!,
      })),
    };
  }

  protected evaluateMemberAccess(expression: MemberAccess): RuntimeValue {
    const enumMember = this.evaluateEnumMemberAccess(expression);

    if (enumMember !== null) return enumMember;

    const receiver = this.evaluateExpression(expression.receiver);

    if (receiver.type === "AnonymousObject") {
      const field = receiver.fields.find(
        (candidate) => candidate.name === expression.member.lexeme,
      );

      if (field === undefined) {
        throw new Error(
          `E_MEM_UNKNOWN: Unknown object field '${expression.member.lexeme}'. ` +
            `at ${expression.member.line}:${expression.member.column}`,
        );
      }

      return field.value;
    }

    if (receiver.type === "Struct") {
      const field = receiver.fields.find(
        (candidate) => candidate.name === expression.member.lexeme,
      );

      if (field !== undefined) return field.value;

      if (
        this.findStructMethod(receiver.name, expression.member.lexeme) !==
        undefined
      ) {
        throw new Error(
          `E_MEM_UNKNOWN: Struct method '${expression.member.lexeme}' may only ` +
            `be invoked directly. at ${expression.member.line}:` +
            `${expression.member.column}`,
        );
      }

      throw new Error(
        `E_MEM_UNKNOWN: Struct '${receiver.name}' has no member ` +
          `'${expression.member.lexeme}'. at ${expression.member.line}:` +
          `${expression.member.column}`,
      );
    }

    throw new Error(
      `E_MEM_TYPE: Type '${this.runtimeTypeName(receiver)}' does not support ` +
        `member '${expression.member.lexeme}'. at ` +
        `${expression.member.line}:${expression.member.column}`,
    );
  }

  protected evaluateMemberAssignment(
    target: MemberAccess,
    valueExpression: Expression,
  ): RuntimeValue {
    this.rejectEnumMemberAssignment(target);

    const receiver = this.evaluateExpression(target.receiver);

    if (receiver.type !== "Struct") {
      throw new Error(
        `E_MEM_TYPE: Type '${this.runtimeTypeName(receiver)}' does not support ` +
          `mutable member '${target.member.lexeme}'. at ` +
          `${target.member.line}:${target.member.column}`,
      );
    }

    const declaration = this.structs.get(receiver.name)!;
    const fieldDeclaration = declaration.fields.find(
      (field) => field.name.lexeme === target.member.lexeme,
    );
    const runtimeField = receiver.fields.find(
      (field) => field.name === target.member.lexeme,
    );

    if (fieldDeclaration === undefined || runtimeField === undefined) {
      throw new Error(
        `E_MEM_UNKNOWN: Struct '${receiver.name}' has no mutable field ` +
          `'${target.member.lexeme}'. at ${target.member.line}:` +
          `${target.member.column}`,
      );
    }

    const value = this.evaluateExpression(valueExpression);

    this.assertStructFieldType(
      declaration,
      fieldDeclaration,
      value,
      target.member,
    );
    runtimeField.value = copyRuntimeValue(value);

    return value;
  }

  protected findStructMethod(
    structName: string,
    methodName: string,
  ): FunctionDeclaration | undefined {
    return this.structs
      .get(structName)
      ?.methods.find((method) => method.name.lexeme === methodName);
  }

  private validateConstructionShape(
    declaration: StructDeclaration,
    expression: StructConstruction,
  ): Set<string> {
    const declaredNames = new Set(
      declaration.fields.map((field) => field.name.lexeme),
    );
    const suppliedNames = new Set<string>();

    for (const supplied of expression.fields) {
      if (suppliedNames.has(supplied.name.lexeme)) {
        throw new Error(
          `E_STRUCT_FIELD_DUP: Struct field '${supplied.name.lexeme}' is ` +
            `supplied more than once. at ${supplied.name.line}:` +
            `${supplied.name.column}`,
        );
      }

      suppliedNames.add(supplied.name.lexeme);

      if (!declaredNames.has(supplied.name.lexeme)) {
        throw new Error(
          `E_STRUCT_FIELD_UNKNOWN: Struct '${declaration.name.lexeme}' has no ` +
            `field '${supplied.name.lexeme}'. at ${supplied.name.line}:` +
            `${supplied.name.column}`,
        );
      }
    }

    for (const field of declaration.fields) {
      if (
        field.defaultValue === null &&
        !suppliedNames.has(field.name.lexeme)
      ) {
        throw new Error(
          `E_STRUCT_FIELD_MISSING: Struct '${declaration.name.lexeme}' requires ` +
            `field '${field.name.lexeme}'. at ${expression.constructor.line}:` +
            `${expression.constructor.column}`,
        );
      }
    }

    return suppliedNames;
  }

  private assertStructFieldType(
    declaration: StructDeclaration,
    field: StructFieldDeclaration,
    value: RuntimeValue,
    location: { line: number; column: number },
  ): void {
    if (this.valueMatchesType(value, field.fieldType)) return;

    throw new Error(
      `E_STRUCT_FIELD_TYPE: Struct '${declaration.name.lexeme}' field ` +
        `'${field.name.lexeme}' expects ` +
        `${this.typeAnnotationName(field.fieldType)}, but received ` +
        `${this.runtimeTypeName(value)}. at ${location.line}:${location.column}`,
    );
  }
}
