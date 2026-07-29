// Phase 9

import { RuntimeValue } from "../runtime-value.js";

export class ReturnSignal {
  constructor(public readonly value: RuntimeValue) {}
}
