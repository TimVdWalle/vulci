// Phase 10

import { Token } from "../token.js";

export function sourceError(
  token: Token,
  message: string,
  code?: string,
): Error {
  const prefix = code === undefined ? "" : `${code}: `;

  return new Error(`${prefix}${message} at ${token.line}:${token.column}`);
}

export function locatedError(
  line: number,
  column: number,
  message: string,
  code: string,
): Error {
  return new Error(`${code}: ${message} at ${line}:${column}`);
}
