// Phase 11

import { RuntimeValue } from "../runtime-value.js";

export function copyRuntimeValue(value: RuntimeValue): RuntimeValue {
  if (value.type !== "Tuple") return value;
  return {
    type: "Tuple",
    members: value.members.map(copyRuntimeValue),
  };
}
