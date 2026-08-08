// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import { Environment } from "../src/environment.js";
import {
  evaluateStructSource as evaluate,
  evaluateStructSourceWithBuiltins,
} from "./struct-test-helpers.ts";

test("struct declarations evaluate to null", () => {
  assert.deepEqual(evaluate("struct Empty {}"), { type: "Null" });
});

test("constructs required and defaulted fields in declaration order", () => {
  assert.deepEqual(
    evaluate(`struct User {
  str name
  int age = 18
}
User(age: 30, name: "Tim")`),
    {
      type: "Struct",
      name: "User",
      fields: [
        { name: "name", value: { type: "String", value: "Tim" } },
        { name: "age", value: { type: "Integer", value: 30 } },
      ],
    },
  );
});

test("evaluates explicit fields first and defaults afterward", () => {
  const environment = new Environment();
  const calls: number[] = [];

  environment.define("mark", {
    type: "NativeFunction",
    parameters: [{ name: "value", required: true }],
    call(arguments_) {
      const value = arguments_[0];
      if (value?.type !== "Integer") throw new Error("expected integer");
      calls.push(value.value);
      return value;
    },
  });

  const result = evaluate(
    `struct Sample {
  int first
  int second = mark(3)
  int third = mark(4)
}
Sample(second: mark(2), first: mark(1))`,
    environment,
  );

  assert.deepEqual(calls, [2, 1, 4]);
  assert.deepEqual(result, {
    type: "Struct",
    name: "Sample",
    fields: [
      { name: "first", value: { type: "Integer", value: 1 } },
      { name: "second", value: { type: "Integer", value: 2 } },
      { name: "third", value: { type: "Integer", value: 4 } },
    ],
  });
});

test("evaluates defaults separately and suppresses supplied defaults", () => {
  const environment = new Environment();
  let calls = 0;

  environment.define("next", {
    type: "NativeFunction",
    parameters: [],
    call() {
      calls++;
      return { type: "Integer", value: calls };
    },
  });

  assert.deepEqual(
    evaluate(
      `struct Value {
  int number = next()
}
Value()
Value(number: 42)
Value()`,
      environment,
    ),
    {
      type: "Struct",
      name: "Value",
      fields: [{ name: "number", value: { type: "Integer", value: 2 } }],
    },
  );
  assert.equal(calls, 2);
});

test("field defaults may use globals, functions, and struct constructors", () => {
  assert.deepEqual(
    evaluate(`$fallback = 40
struct Number {
  int value
}
fn fallback() returns int {
  2
}
struct Wrapper {
  Number number = Number(value: $fallback + fallback())
}
Wrapper().number.value`),
    { type: "Integer", value: 42 },
  );
});

test("field defaults cannot access ordinary globals or caller locals", () => {
  assert.throws(
    () =>
      evaluate(`$fallback = 42
struct Value {
  int number = fallback
}
Value()`),
    /Undefined variable 'fallback'/,
  );

  assert.throws(
    () =>
      evaluate(`struct Value {
  int number = local
}
fn create() returns Value {
  local = 42
  Value()
}
create()`),
    /Undefined variable 'local'/,
  );
});

test("field defaults cannot access fields, arguments, or self", () => {
  assert.throws(
    () =>
      evaluate(`struct Pair {
  int first
  int second = first
}
Pair(first: 1)`),
    /Undefined variable 'first'/,
  );

  assert.throws(
    () =>
      evaluate(`struct Pair {
  int first = self.second
  int second = 2
}
Pair()`),
    /E_SELF_CONTEXT/,
  );
});

test("validates construction shape before evaluating supplied fields", () => {
  const environment = new Environment();
  let calls = 0;

  environment.define("mark", {
    type: "NativeFunction",
    parameters: [],
    call() {
      calls++;
      return { type: "Integer", value: 1 };
    },
  });

  assert.throws(
    () =>
      evaluate(
        `struct Pair {
  int first
  int second
}
Pair(first: mark())`,
        environment,
      ),
    /E_STRUCT_FIELD_MISSING/,
  );
  assert.equal(calls, 0);

  assert.throws(
    () =>
      evaluate(
        `struct Value {
  int number
}
Value(extra: mark())`,
        environment,
      ),
    /E_STRUCT_FIELD_UNKNOWN/,
  );
  assert.equal(calls, 0);
});

test("validates explicit and default field types", () => {
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
}
Value(number: "wrong")`),
    /E_STRUCT_FIELD_TYPE.*expects int.*received string/i,
  );

  assert.throws(
    () =>
      evaluate(`struct Value {
  int number = "wrong"
}
Value()`),
    /E_STRUCT_FIELD_TYPE.*expects int.*received string/i,
  );
});

test("supports empty structs and forward references", () => {
  assert.deepEqual(
    evaluate(`struct Wrapper {
  Empty value
}
struct Empty {}
Wrapper(value: Empty()).value`),
    { type: "Struct", name: "Empty", fields: [] },
  );
});

test("accepts nullable direct and indirect recursive structs", () => {
  assert.deepEqual(
    evaluate(`struct Node {
  int value
  Node|null next = null
}
Node(value: 1).next`),
    { type: "Null" },
  );

  assert.deepEqual(
    evaluate(`struct A {
  B value
}
struct B {
  A|null parent = null
}
A(value: B()).value.parent`),
    { type: "Null" },
  );
});

test("rejects non-nullable direct and indirect recursion", () => {
  assert.throws(
    () => evaluate("struct Node {\n  Node next\n}"),
    /E_STRUCT_RECURSION/,
  );
  assert.throws(
    () =>
      evaluate(`struct A {
  B value
}
struct B {
  A value
}`),
    /E_STRUCT_RECURSION/,
  );
});

test("prints constructor syntax in field declaration order", () => {
  const messages: unknown[][] = [];
  const originalLog = console.log;
  console.log = (...values: unknown[]) => messages.push(values);

  try {
    evaluateStructSourceWithBuiltins(`struct Address {
  str city
}
struct User {
  str name
  Address address
}
print(User(address: Address(city: "Rome"), name: "Tim"))`);
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(messages, [
    ["User(name: Tim, address: Address(city: Rome))"],
  ]);
});
