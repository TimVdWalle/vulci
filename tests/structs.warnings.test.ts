// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateStructSource as evaluate,
  parseStructSource as parse,
} from "./struct-test-helpers.ts";

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

test("typed struct methods produce no annotation warnings", () => {
  const warnings = captureWarnings(() =>
    parse(`struct Value {
  int number
  fn add(int amount) returns int {
    self.number + amount
  }
}`),
  );

  assert.deepEqual(warnings, []);
});

test("untyped method annotations use the existing warnings", () => {
  const warnings = captureWarnings(() =>
    parse(`struct Value {
  int number
  fn add(amount) {
    self.number + amount
  }
}`),
  );

  assert.equal(warnings.length, 2);
  assert.match(warnings[0]!, /parameter 'amount'/);
  assert.match(warnings[1]!, /function 'add'/);
});

test("method declaration warnings are not repeated by calls", () => {
  const warnings = captureWarnings(() =>
    evaluate(`struct Value {
  int number
  fn identity(value) {
    value
  }
}
$item = Value(number: 1)
$item.identity(1)
$item.identity(2)`),
  );

  assert.equal(warnings.length, 2);
});

test("explicit any method annotations do not warn", () => {
  const warnings = captureWarnings(() =>
    parse(`struct Value {
  int number
  fn identity(any value) returns any {
    value
  }
}`),
  );

  assert.deepEqual(warnings, []);
});
