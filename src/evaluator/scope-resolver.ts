// Phase 13

import { Environment } from "../environment.js";
import { RuntimeValue } from "../runtime-value.js";
import { TypeChecker } from "./type-checker.js";
import { copyRuntimeValue } from "./value-copy.js";

export abstract class ScopeResolver extends TypeChecker {
  protected assignVariable(name: string, value: RuntimeValue): void {
    if (name === "self") {
      const code =
        this.currentSelf === null ? "E_SELF_CONTEXT" : "E_SELF_ASSIGN";
      const message =
        this.currentSelf === null
          ? "'self' can only be used inside a struct method."
          : "The 'self' binding cannot be reassigned.";

      throw new Error(`${code}: ${message}`);
    }

    if (this.defaultEvaluationContext !== null) {
      throw new Error("Assignments are not allowed in default expressions.");
    }

    if (this.structs.has(name)) {
      throw new Error(
        `E_STRUCT_DUP: Struct name '${name}' cannot be rebound as a variable.`,
      );
    }

    const assignedValue = copyRuntimeValue(value);

    if (name.startsWith("$")) {
      if (
        this.currentEnvironment !== this.environment &&
        this.findValue(this.environment, name) === undefined
      ) {
        throw new Error(
          `Global variable '${name}' must be declared at the top level ` +
            "before it can be assigned inside a function.",
        );
      }

      this.environment.define(name, assignedValue);
      return;
    }

    if (
      this.currentEnvironment === this.environment &&
      this.functions.has(name)
    ) {
      throw new Error(`Name '${name}' is already defined as a function.`);
    }

    const parameterType = this.currentParameterTypes.get(name);

    if (
      parameterType !== undefined &&
      parameterType !== null &&
      !this.valueMatchesType(assignedValue, parameterType)
    ) {
      const declaration = this.currentFunction;
      const parameter = declaration?.parameters.find(
        (candidate) => candidate.lexeme === name,
      );

      throw new Error(
        `Cannot assign ${this.runtimeTypeName(assignedValue)} to parameter ` +
          `'${name}' of function ` +
          `'${declaration?.name.lexeme ?? "<unknown>"}': expected ` +
          `${this.typeAnnotationName(parameterType)}. at ` +
          `${parameter?.line ?? 0}:${parameter?.column ?? 0}`,
      );
    }

    this.currentEnvironment.define(name, assignedValue);
  }

  protected findValue(
    environment: Environment,
    name: string,
  ): RuntimeValue | undefined {
    try {
      return environment.get(name);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === `Undefined variable '${name}'.`
      ) {
        return undefined;
      }

      throw error;
    }
  }
}
