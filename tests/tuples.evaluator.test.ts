// Phase 11

import assert from "node:assert/strict";
import test from "node:test";
import { registerBuiltins } from "../src/builtins.js";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

function evaluate(source: string): RuntimeValue {
  const originalWarn = console.warn;
  console.warn = () => undefined;

  try {
    const environment = new Environment();
    registerBuiltins(environment);

    return new Evaluator(environment).evaluate(
      new Parser(new Lexer(source).lex()).parse(),
    );
  } finally {
    console.warn = originalWarn;
  }
}

test("evaluates and indexes tuples", () => {
  assert.deepEqual(evaluate("(10, 20)[1]"), {
    type: "Integer",
    value: 20,
  });

  assert.deepEqual(evaluate("((1, 2), 3)[0][1]"), {
    type: "Integer",
    value: 2,
  });
});

test("evaluates tuple members from left to right", () => {
  assert.deepEqual(
    evaluate(`$value = 0
$result = (($value = $value + 1), ($value = $value + 1))
($result[0], $result[1], $value)`),
    {
      type: "Tuple",
      members: [
        { type: "Integer", value: 1 },
        { type: "Integer", value: 2 },
        { type: "Integer", value: 2 },
      ],
    },
  );
});

test("validates tuple parameter and return types structurally", () => {
  assert.deepEqual(
    evaluate(`fn swap(tuple(int, str) value) returns tuple(str, int) {
  (value[1], value[0])
}
swap((7, "seven"))`),
    {
      type: "Tuple",
      members: [
        { type: "String", value: "seven" },
        { type: "Integer", value: 7 },
      ],
    },
  );
});

test("accepts nested tuples and tuple unions", () => {
  assert.deepEqual(
    evaluate(`fn keep(tuple(tuple(int, int), str|null) value) returns tuple(tuple(int, int), str|null)|null {
  value
}
keep(((1, 2), null))`),
    {
      type: "Tuple",
      members: [
        {
          type: "Tuple",
          members: [
            { type: "Integer", value: 1 },
            { type: "Integer", value: 2 },
          ],
        },
        { type: "Null" },
      ],
    },
  );
});

test("rejects tuple type arity and member mismatches", () => {
  assert.throws(
    () =>
      evaluate(`fn use(tuple(int, str) value) returns int {
  1
}
use((1, 2))`),
    /expects tuple\(int, str\), but received tuple/,
  );

  assert.throws(
    () =>
      evaluate(`fn use(tuple(int, str) value) returns int {
  1
}
use((1, "x", 3))`),
    /expects tuple\(int, str\), but received tuple/,
  );
});

test("reports indexing diagnostics", () => {
  assert.throws(() => evaluate("1[0]"), /IDX_TARGET/);
  assert.throws(() => evaluate("(1, 2)[true]"), /IDX_TYPE/);
  assert.throws(() => evaluate("(1, 2)[-1]"), /IDX_RANGE/);
  assert.throws(() => evaluate("(1, 2)[2]"), /IDX_RANGE/);
});

test("prints nested tuples recursively", () => {
  const output: string[] = [];
  const originalLog = console.log;

  console.log = (...values: unknown[]) => {
    output.push(values.map(String).join(" "));
  };

  try {
    evaluate('print(((1, 2), "x", true, null))');
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(output, ["((1, 2), x, true, null)"]);
});
