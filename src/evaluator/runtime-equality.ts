// Phase 13

import { RuntimeValue } from "../runtime-value.js";

export class RuntimeEqualityError extends Error {}

export function runtimeValuesEqual(
  left: RuntimeValue,
  right: RuntimeValue,
): boolean {
  if (left.type !== right.type) {
    throw new RuntimeEqualityError("Operands have different runtime types.");
  }

  switch (left.type) {
    case "Integer":
      return right.type === "Integer" && left.value === right.value;
    case "String":
      return right.type === "String" && left.value === right.value;
    case "Boolean":
      return right.type === "Boolean" && left.value === right.value;
    case "Null":
      return right.type === "Null";
    case "Struct":
      if (right.type !== "Struct") return false;
      if (left.name !== right.name) return false;
      if (left.fields.length !== right.fields.length) return false;

      return left.fields.every((field, index) => {
        const other = right.fields[index];
        return (
          other !== undefined &&
          field.name === other.name &&
          runtimeValuesEqual(field.value, other.value)
        );
      });
    case "Tuple":
    case "AnonymousObject":
    case "NativeFunction":
      throw new RuntimeEqualityError(
        `Equality is not supported for ${left.type.toLowerCase()} values.`,
      );
  }
}
