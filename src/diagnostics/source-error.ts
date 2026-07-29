// Phase 9

import { Token } from "../token.js";

export function sourceError(token: Token, message: string): Error {
  return new Error(`${message} at ${token.line}:${token.column}`);
}
