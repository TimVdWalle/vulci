// Phase 14

import assert from "node:assert/strict";
import test from "node:test";
import { parseEnumSource as parse } from "./enum-test-helpers.ts";

function captureWarnings(action: () => unknown): string[] {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => {
    warnings.push(values.map(String).join(" "));
  };

  try {
    action();
  } finally {
    console.warn = originalWarn;
  }

  return warnings;
}

test("enum declarations and unused members produce no warnings", () => {
  const warnings = captureWarnings(() =>
    parse(`enum Status {
  Pending
  Running
}`),
  );

  assert.deepEqual(warnings, []);
});

test("typed enum parameters and returns produce no warnings", () => {
  const warnings = captureWarnings(() =>
    parse(`fn keep(Status value) returns Status {
  value
}
enum Status {
  Pending
}`),
  );

  assert.deepEqual(warnings, []);
});
