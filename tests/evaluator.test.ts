import assert from "node:assert/strict";
import test from "node:test";

import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

function evaluate(source: string, environment: Environment): RuntimeValue {
  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();
  const evaluator = new Evaluator(environment);

  return evaluator.evaluate(program);
}

test("stores and retrieves variables", () => {
  const environment = new Environment();

  evaluate("answer = 42", environment);

  assert.deepEqual(environment.get("answer"), {
    type: "Integer",
    value: 42,
  });
});

test("calls native functions with evaluated arguments", () => {
  const environment = new Environment();
  let receivedArguments: unknown;

  environment.define("capture", {
    type: "NativeFunction",
    call(arguments_) {
      receivedArguments = arguments_;

      return {
        type: "Null",
      };
    },
  });

  evaluate(
    `answer = 42
capture(answer)
`,
    environment,
  );

  assert.deepEqual(receivedArguments, [
    {
      type: "Integer",
      value: 42,
    },
  ]);
});

test("reports undefined variables", () => {
  const environment = new Environment();

  assert.throws(
    () => evaluate("print(answer)", environment),
    /Undefined variable 'print'/,
  );
});

test("reports values that are not callable", () => {
  const environment = new Environment();

  assert.throws(
    () =>
      evaluate(
        `answer = 42
answer()
`,
        environment,
      ),
    /'answer' is not callable/,
  );
});

test("evaluates addition", () => {
  const result = evaluate("1 + 2", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 3,
  });
});

test("evaluates subtraction", () => {
  const result = evaluate("10 - 3", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 7,
  });
});

test("evaluates multiplication", () => {
  const result = evaluate("6 * 7", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 42,
  });
});

test("evaluates integer division", () => {
  const result = evaluate("20 / 4", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 5,
  });
});

test("truncates positive division toward zero", () => {
  const result = evaluate("25 / 4", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 6,
  });
});

test("truncates negative division toward zero", () => {
  const result = evaluate("-25 / 4", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: -6,
  });
});

test("evaluates remainder", () => {
  const result = evaluate("25 % 4", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 1,
  });
});

test("preserves a negative dividend for remainder", () => {
  const result = evaluate("-25 % 4", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: -1,
  });
});

test("evaluates unary negation", () => {
  const result = evaluate("-42", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: -42,
  });
});

test("evaluates parenthesized repeated negation", () => {
  const result = evaluate("-(-5)", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 5,
  });
});

test("respects multiplication precedence", () => {
  const result = evaluate("1 + 2 * 3", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 7,
  });
});

test("respects parentheses", () => {
  const result = evaluate("(1 + 2) * 3", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 9,
  });
});

test("evaluates addition and subtraction left-associatively", () => {
  const result = evaluate("10 - 3 + 2", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 9,
  });
});

test("evaluates division left-associatively", () => {
  const result = evaluate("20 / 5 / 2", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 2,
  });
});

test("evaluates expressions containing variables", () => {
  const environment = new Environment();

  const result = evaluate(
    `value = 10
value + 3 * 4
`,
    environment,
  );

  assert.deepEqual(result, {
    type: "Integer",
    value: 22,
  });
});

test("evaluates integers containing separators", () => {
  const result = evaluate("1_000_000 + 2_000", new Environment());

  assert.deepEqual(result, {
    type: "Integer",
    value: 1_002_000,
  });
});

test("reports division by zero at the operator", () => {
  assert.throws(
    () => evaluate("10 / 0", new Environment()),
    /Division by zero at 1:4/,
  );
});

test("reports remainder by zero at the operator", () => {
  assert.throws(
    () => evaluate("10 % 0", new Environment()),
    /Remainder by zero at 1:4/,
  );
});

test("reports addition overflow at the operator", () => {
  assert.throws(
    () => evaluate("9_007_199_254_740_991 + 1", new Environment()),
    /Integer arithmetic result is outside the supported range at 1:23/,
  );
});

test("reports subtraction overflow at the operator", () => {
  assert.throws(
    () => evaluate("-9_007_199_254_740_991 - 1", new Environment()),
    /Integer arithmetic result is outside the supported range at 1:24/,
  );
});

test("reports multiplication overflow at the operator", () => {
  assert.throws(
    () => evaluate("9_007_199_254_740_991 * 2", new Environment()),
    /Integer arithmetic result is outside the supported range at 1:23/,
  );
});

test("reports intermediate-result overflow immediately", () => {
  assert.throws(
    () => evaluate("(9_007_199_254_740_991 + 1) - 1", new Environment()),
    /Integer arithmetic result is outside the supported range at 1:24/,
  );
});
