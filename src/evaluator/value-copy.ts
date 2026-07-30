// Phase 12

import { RuntimeValue } from "../runtime-value.js";

export function copyRuntimeValue(value: RuntimeValue): RuntimeValue {
  if (value.type === "Tuple") {
    return {
      type: "Tuple",
      members: value.members.map(copyRuntimeValue),
    };
  }

  if (value.type === "AnonymousObject") {
    return {
      type: "AnonymousObject",
      fields: value.fields.map((field) => ({
        name: field.name,
        value: copyRuntimeValue(field.value),
      })),
    };
  }

  return value;
}
