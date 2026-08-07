// Phase 14

import { Environment } from "./environment.js";
import { NULL_VALUE, RuntimeValue } from "./runtime-value.js";

export function registerBuiltins(environment: Environment): void {
  environment.define("print", {
    type: "NativeFunction",

    parameters: [
      {
        name: "value",
        required: true,
      },
    ],

    call(arguments_: RuntimeValue[]): RuntimeValue {
      const output = arguments_.map(formatValue);

      console.log(...output);

      return NULL_VALUE;
    },
  });
}

function formatValue(value: RuntimeValue): string {
  switch (value.type) {
    case "Integer":
      return value.value.toString();

    case "String":
      return value.value;

    case "Boolean":
      return value.value ? "true" : "false";

    case "Null":
      return "null";

    case "Tuple":
      return `(${value.members.map(formatValue).join(", ")})`;

    case "AnonymousObject":
      return `object(${value.fields
        .map((field) => `${field.name}: ${formatValue(field.value)}`)
        .join(", ")})`;

    case "Struct":
      return `${value.name}(${value.fields
        .map((field) => `${field.name}: ${formatValue(field.value)}`)
        .join(", ")})`;

    case "Enum":
      return `${value.enumName}.${value.memberName}`;

    case "NativeFunction":
      return "";
  }
}
