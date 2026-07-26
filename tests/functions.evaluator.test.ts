// Phase 7

import assert from "node:assert/strict";
import test from "node:test";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

function evaluate(
  source: string,
  environment = new Environment(),
): RuntimeValue {
  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();

  return new Evaluator(environment).evaluate(program);
}

test("calls a function with arguments", () => {
  assert.deepEqual(
    evaluate(`fn add(left, right) {
  return left + right
}

add(20, 22)`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("calls a function without arguments", () => {
  assert.deepEqual(
    evaluate(`fn answer() {
  return 42
}

answer()`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("uses the final expression as the function result", () => {
  assert.deepEqual(
    evaluate(`fn add(left, right) {
  left + right
}

add(20, 22)`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("return without a value returns null", () => {
  assert.deepEqual(
    evaluate(`fn stop() {
  return
}

stop()`),
    {
      type: "Null",
    },
  );
});

test("return immediately exits the function", () => {
  assert.deepEqual(
    evaluate(`fn choose(value) {
  if (value == 1) {
    return 10
  }

  20
}

choose(1)`),
    {
      type: "Integer",
      value: 10,
    },
  );
});

test("evaluates function arguments before entering the function", () => {
  assert.deepEqual(
    evaluate(`fn identity(value) {
  return value
}

identity(20 + 22)`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("function parameters are local variables", () => {
  assert.throws(
    () =>
      evaluate(`fn identity(value) {
  return value
}

identity(42)
value`),
    /Undefined variable 'value'\./,
  );
});

test("assignments inside functions remain local", () => {
  assert.throws(
    () =>
      evaluate(`fn calculate() {
  localValue = 42
  return localValue
}

calculate()
localValue`),
    /Undefined variable 'localValue'\./,
  );
});

test("separate function calls use separate local environments", () => {
  assert.deepEqual(
    evaluate(`fn identity(value) {
  localValue = value
  return localValue
}

identity(1)
identity(42)`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("reads a declared global variable inside a function", () => {
  assert.deepEqual(
    evaluate(`$value = 42

fn readGlobal() {
  return $value
}

readGlobal()`),
    {
      type: "Integer",
      value: 42,
    },
  );
});

test("updates a declared global variable inside a function", () => {
  assert.deepEqual(
    evaluate(`$counter = 0

fn increment() {
  $counter = $counter + 1
  return $counter
}

increment()
increment()
$counter`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("rejects assigning an undeclared global inside a function", () => {
  assert.throws(
    () =>
      evaluate(`fn createGlobal() {
  $value = 42
}

createGlobal()`),
    /Global variable '\$value' must be declared at the top level before it can be assigned inside a function\./,
  );
});

test("functions can call native functions", () => {
  const environment = new Environment();
  let captured: RuntimeValue[] = [];

  environment.define("capture", {
    type: "NativeFunction",
    call(arguments_) {
      captured = arguments_;

      return {
        type: "Null",
      };
    },
  });

  evaluate(
    `fn send(value) {
  capture(value)
}

send(42)`,
    environment,
  );

  assert.deepEqual(captured, [
    {
      type: "Integer",
      value: 42,
    },
  ]);
});

test("supports calling a function declared later in the file", () => {
  assert.deepEqual(
    evaluate(`first()

fn first() {
  return 42
}`),
    {
      type: "Null",
    },
  );
});

test("supports direct recursion", () => {
  assert.deepEqual(
    evaluate(`fn factorial(value) {
  if (value == 0) {
    return 1
  }

  return value * factorial(value - 1)
}

factorial(5)`),
    {
      type: "Integer",
      value: 120,
    },
  );
});

test("supports mutual recursion", () => {
  assert.deepEqual(
    evaluate(`fn isEven(value) {
  if (value == 0) {
    return true
  }

  return isOdd(value - 1)
}

fn isOdd(value) {
  if (value == 0) {
    return false
  }

  return isEven(value - 1)
}

isEven(10)`),
    {
      type: "Boolean",
      value: true,
    },
  );
});

test("reports an undefined function", () => {
  assert.throws(
    () => evaluate("missing()"),
    /Undefined function 'missing'\. at 1:1/,
  );
});

test("reports a global value that is not a function", () => {
  assert.throws(
    () =>
      evaluate(`value = 42
value()`),
    /Cannot call 'value': value is not a function\./,
  );
});

test("reports a local value that is not a function", () => {
  assert.throws(
    () =>
      evaluate(`fn run(value) {
  value()
}

run(42)`),
    /Cannot call 'value': value is not a function\./,
  );
});

test("reports too few arguments", () => {
  assert.throws(
    () =>
      evaluate(`fn add(left, right) {
  return left + right
}

add(1)`),
    /Function 'add' expects 2 argument\(s\), but received 1\./,
  );
});

test("reports too many arguments", () => {
  assert.throws(
    () =>
      evaluate(`fn identity(value) {
  return value
}

identity(1, 2)`),
    /Function 'identity' expects 1 argument\(s\), but received 2\./,
  );
});

test("rejects duplicate function names", () => {
  assert.throws(
    () =>
      evaluate(`fn answer() {
  return 42
}

fn answer() {
  return 43
}`),
    /Function 'answer' is already defined\./,
  );
});

test("rejects assigning a top-level value to a function name", () => {
  assert.throws(
    () =>
      evaluate(`fn answer() {
  return 42
}

answer = 43`),
    /Name 'answer' is already defined as a function\./,
  );
});

test("rejects return outside a function", () => {
  assert.throws(
    () => evaluate("return 42"),
    /'return' can only be used inside a function\./,
  );
});

test("reports excessive recursion as a Vulci runtime error", () => {
  assert.throws(
    () =>
      evaluate(`fn loop() {
  loop()
}

loop()`),
    /Maximum function call depth exceeded while calling 'loop'\. at 2:3/,
  );
});

test("does not leak the host stack-overflow diagnostic", () => {
  let thrown: unknown;

  try {
    evaluate(`fn loop() {
  loop()
}

loop()`);
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown instanceof Error);

  assert.match(
    thrown.message,
    /Maximum function call depth exceeded while calling 'loop'\./,
  );

  assert.doesNotMatch(thrown.message, /RangeError/);
  assert.doesNotMatch(thrown.message, /Maximum call stack size exceeded/);
});
