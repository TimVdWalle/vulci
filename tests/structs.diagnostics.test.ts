// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import { Environment } from "../src/environment.js";
import {
  parseStructSource as parse,
  evaluateStructSource as evaluate,
} from "./struct-test-helpers.ts";

test("reports duplicate and built-in struct names with E_STRUCT_DUP", () => {
  assert.throws(
    () => evaluate("struct User {}\nstruct User {}"),
    /E_STRUCT_DUP/,
  );
  assert.throws(() => evaluate("struct int {}"), /E_STRUCT_DUP/);
});

test("reports struct collisions with functions and existing values", () => {
  assert.throws(
    () =>
      evaluate(`fn User() returns null {
  null
}
struct User {}`),
    /E_STRUCT_DUP/,
  );

  const environment = new Environment();
  environment.define("User", {
    type: "NativeFunction",
    parameters: [],
    call() {
      return { type: "Null" };
    },
  });
  assert.throws(() => evaluate("struct User {}", environment), /E_STRUCT_DUP/);
});

test("reports struct-name rebinding as variables or parameters", () => {
  assert.throws(() => evaluate("struct User {}\nUser = 1"), /E_STRUCT_DUP/);
  assert.throws(
    () =>
      evaluate(`struct User {}
fn invalid() returns int {
  User = 1
  User
}`),
    /E_STRUCT_DUP/,
  );
  assert.throws(
    () =>
      evaluate(`struct User {}
fn invalid(any User) returns any {
  User
}`),
    /E_STRUCT_DUP/,
  );
});

test("keeps dollar-prefixed globals distinct from struct names", () => {
  assert.deepEqual(evaluate("struct User {}\n$User = 1\nUser()"), {
    type: "Struct",
    name: "User",
    fields: [],
  });
});

test("reports duplicate members with E_STRUCT_MEMBER_DUP", () => {
  assert.throws(
    () => parse("struct Value {\n  int number\n  int number\n}"),
    /E_STRUCT_MEMBER_DUP/,
  );
});

test("reports construction shape diagnostics", () => {
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
}
Value()`),
    /E_STRUCT_FIELD_MISSING/,
  );
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number = 1
}
Value(extra: 2)`),
    /E_STRUCT_FIELD_UNKNOWN/,
  );
  assert.throws(
    () =>
      parse(`struct Value {
  int number
}
Value(number: 1, number: 2)`),
    /E_STRUCT_FIELD_DUP/,
  );
});

test("reports field type and recursion diagnostics", () => {
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
}
Value(number: false)`),
    /E_STRUCT_FIELD_TYPE/,
  );
  assert.throws(
    () => evaluate("struct Value {\n  Value nested\n}"),
    /E_STRUCT_RECURSION/,
  );
});

test("reports self context and assignment diagnostics", () => {
  assert.throws(() => evaluate("self"), /E_SELF_CONTEXT/);
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
  fn invalid() returns Value {
    self = Value(number: 2)
  }
}
Value(number: 1).invalid()`),
    /E_SELF_ASSIGN/,
  );
});

test("reports general struct member diagnostics", () => {
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
}
Value(number: 1).missing`),
    /E_MEM_UNKNOWN/,
  );
  assert.throws(() => evaluate("true.missing"), /E_MEM_TYPE/);
});
