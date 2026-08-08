// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import { registerBuiltins } from "../src/builtins.js";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

function evaluate(source: string) {
  const environment = new Environment();
  registerBuiltins(environment);

  return new Evaluator(environment).evaluate(
    new Parser(new Lexer(source).lex()).parse(),
  );
}

test("constructs objects and reads chained fields", () => {
  const result = evaluate(`
$user = object(
  name: "Tim",
  address: object(
    city: "Rome",
  ),
)

$user.address.city
`);

  assert.deepEqual(result, {
    type: "String",
    value: "Rome",
  });
});

test("evaluates fields once from left to right", () => {
  const result = evaluate(`
$order = 0

fn mark(int value) returns int {
  $order = $order * 10 + value
  return value
}

object(
  first: mark(1),
  second: mark(2),
)

$order
`);

  assert.deepEqual(result, {
    type: "Integer",
    value: 12,
  });
});

test("stops evaluating later fields after a failure", () => {
  assert.throws(
    () =>
      evaluate(`
fn fail() returns int {
  missing
}

object(
  first: fail(),
  second: missing_too,
)
`),
    /Undefined variable 'missing'/,
  );
});

test("copies anonymous objects with value semantics", () => {
  const result = evaluate(`
$original = object(
  pair: (1, 2),
)

$copy = $original
$copy.pair[0]
`);

  assert.deepEqual(result, {
    type: "Integer",
    value: 1,
  });
});

test("rejects anonymous-object field assignment at runtime", () => {
  assert.throws(
    () =>
      evaluate(`$user = object(name: "Tim")
$user.name = "Bob"`),
    /E_MEM_TYPE:/,
  );
});

test("reports unknown fields", () => {
  assert.throws(
    () => evaluate("object(name: 1).age"),
    /E_MEM_UNKNOWN: Unknown object field 'age'/,
  );
});

test("reports unsupported member-access targets", () => {
  assert.throws(() => evaluate("1.name"), /E_MEM_TYPE/);
});

test("prints nested objects in declaration order", () => {
  const messages: unknown[][] = [];
  const originalConsoleLog = console.log;

  console.log = (...values: unknown[]) => {
    messages.push(values);
  };

  try {
    evaluate(`
print(
  object(
    name: "Tim",
    address: object(
      city: "Rome",
    ),
  ),
)
`);
  } finally {
    console.log = originalConsoleLog;
  }

  assert.deepEqual(messages, [
    ["object(name: Tim, address: object(city: Rome))"],
  ]);
});
