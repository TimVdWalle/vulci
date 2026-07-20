import { Environment } from "./environment.js";
import { NULL_VALUE, RuntimeValue } from "./runtime-value.js";

export function registerBuiltins(environment: Environment): void {
  environment.define("print", {
    type: "NativeFunction",

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

    case "Boolean":
      return value.value ? "true" : "false";

    case "Null":
      return "null";

    case "NativeFunction":
      return "";
  }
}
