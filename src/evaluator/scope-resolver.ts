// Phase 9

import { Environment } from "../environment.js";
import { RuntimeValue } from "../runtime-value.js";
import { TypeChecker } from "./type-checker.js";

export abstract class ScopeResolver extends TypeChecker {
  protected assignVariable(name: string, value: RuntimeValue): void {
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

      this.environment.define(name, value);

      return;
    }

    if (
      this.currentEnvironment === this.environment &&
      this.functions.has(name)
    ) {
      throw new Error(`Name '${name}' is already defined as a function.`);
    }

    const parameterType = this.currentParameterTypes.get(name);

    if (parameterType !== undefined && parameterType !== null) {
      if (!this.valueMatchesType(value, parameterType)) {
        const declaration = this.currentFunction;

        const parameter = declaration?.parameters.find(
          (candidate) => candidate.lexeme === name,
        );

        throw new Error(
          `Cannot assign ${this.runtimeTypeName(value)} to parameter '${name}' ` +
            `of function '${declaration?.name.lexeme ?? "<unknown>"}': expected ` +
            `${this.typeAnnotationName(parameterType)}. at ` +
            `${parameter?.line ?? 0}:${parameter?.column ?? 0}`,
        );
      }
    }

    this.currentEnvironment.define(name, value);
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
