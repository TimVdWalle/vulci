// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import { evaluateStructSource as evaluate } from "./struct-test-helpers.ts";

test("reads and mutates direct struct fields", () => {
  assert.deepEqual(
    evaluate(`struct Point {
  int x
  int y
}
point = Point(x: 1, y: 2)
point.x = 42
point.x`),
    { type: "Integer", value: 42 },
  );
});

test("mutates nested struct fields", () => {
  assert.deepEqual(
    evaluate(`struct Address {
  str city
}
struct User {
  Address address
}
user = User(address: Address(city: "Rome"))
user.address.city = "Paris"
user.address.city`),
    { type: "String", value: "Paris" },
  );
});

test("field assignment is an expression", () => {
  assert.deepEqual(
    evaluate(`struct Value {
  int number
}
value = Value(number: 1)
(value.number = 42) + 1`),
    { type: "Integer", value: 43 },
  );
});

test("struct assignment creates an independent copy", () => {
  assert.deepEqual(
    evaluate(`struct Counter {
  int value
}
original = Counter(value: 1)
copy = original
copy.value = 2
original.value`),
    { type: "Integer", value: 1 },
  );
});

test("struct assignment recursively copies nested values", () => {
  assert.deepEqual(
    evaluate(`struct Inner {
  int value
}
struct Outer {
  Inner inner
}
original = Outer(inner: Inner(value: 1))
copy = original
copy.inner.value = 2
original.inner.value`),
    { type: "Integer", value: 1 },
  );
});

test("construction and field assignment copy supplied struct values", () => {
  assert.deepEqual(
    evaluate(`struct Item {
  int value
}
struct Box {
  Item item
}
item = Item(value: 1)
box = Box(item: item)
item.value = 2
box.item.value`),
    { type: "Integer", value: 1 },
  );

  assert.deepEqual(
    evaluate(`struct Item {
  int value
}
struct Box {
  Item item
}
first = Item(value: 1)
second = Item(value: 2)
box = Box(item: first)
box.item = second
second.value = 3
box.item.value`),
    { type: "Integer", value: 2 },
  );
});

test("function parameters receive independent struct values", () => {
  assert.deepEqual(
    evaluate(`struct Counter {
  int value
}
fn changed(Counter counter) returns Counter {
  counter.value = 2
  counter
}
original = Counter(value: 1)
changed(original)
original.value`),
    { type: "Integer", value: 1 },
  );
});

test("uses struct types in parameters and return values", () => {
  assert.deepEqual(
    evaluate(`struct User {
  str name
}
fn identity(User value) returns User {
  value
}
identity(User(name: "Tim")).name`),
    { type: "String", value: "Tim" },
  );
});

test("matches struct types inside unions and tuple types", () => {
  assert.deepEqual(
    evaluate(`struct User {
  str name
}
fn first(tuple(User, int) value) returns User|null {
  value[0]
}
fn maybe(User|null value) returns User|null {
  value
}
maybe(first((User(name: "Tim"), 1))).name`),
    { type: "String", value: "Tim" },
  );
});

test("does not treat anonymous objects as compatible structs", () => {
  assert.throws(
    () =>
      evaluate(`struct User {
  str name
}
fn read(User user) returns str {
  user.name
}
read(object(name: "Tim"))`),
    /expects User.*received anonymousobject/i,
  );
});

test("rejects field assignment with the wrong declared type", () => {
  assert.throws(
    () =>
      evaluate(`struct Value {
  int number
}
value = Value(number: 1)
value.number = "wrong"`),
    /E_STRUCT_FIELD_TYPE.*expects int.*received string/i,
  );
});

test("reports unknown struct fields and invalid member targets", () => {
  assert.throws(
    () =>
      evaluate(`struct User {
  str name
}
User(name: "Tim").age`),
    /E_MEM_UNKNOWN.*age/,
  );
  assert.throws(() => evaluate("1.value"), /E_MEM_TYPE/);
  assert.throws(
    () =>
      evaluate(`struct User {
  str name
}
user = User(name: "Tim")
user.age = 1`),
    /E_MEM_UNKNOWN.*age/,
  );
});
