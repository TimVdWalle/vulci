// Phase 7

import { RuntimeValue } from "./runtime-value.js";

export class Environment {
  private readonly values = new Map<string, RuntimeValue>();

  public define(name: string, value: RuntimeValue): void {
    this.values.set(name, value);
  }

  public get(name: string): RuntimeValue {
    const value = this.values.get(name);

    if (!value) {
      throw new Error(`Undefined variable '${name}'.`);
    }

    return value;
  }
}
