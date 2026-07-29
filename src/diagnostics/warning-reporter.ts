// Phase 9

import { Token } from "../token.js";

export function reportWarning(
  severity: "warning" | "strong warning",
  message: string,
  token: Token,
): void {
  console.warn(`${severity}: ${message} at ${token.line}:${token.column}`);
}
