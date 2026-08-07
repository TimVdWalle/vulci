// Phase 14

import assert from "node:assert/strict";
import test from "node:test";
import { parseEnumSource as parse } from "./enum-test-helpers.ts";

test("parses enum declarations and their bare members", () => {
  const program = parse(`enum Status {
  Pending
  Running
  Finished
}`);
  const declaration = program.statements[0]!.expression;

  assert.equal(declaration.type, "EnumDeclaration");
  if (declaration.type !== "EnumDeclaration") return;
  assert.equal(declaration.keyword.lexeme, "enum");
  assert.equal(declaration.name.lexeme, "Status");
  assert.deepEqual(
    declaration.members.map((member) => member.lexeme),
    ["Pending", "Running", "Finished"],
  );
});

test("parses qualified enum values through ordinary member access", () => {
  const program = parse(`Status.Pending
enum Status {
  Pending
}`);
  const reference = program.statements[0]!.expression;

  assert.equal(reference.type, "MemberAccess");
  if (reference.type !== "MemberAccess") return;
  assert.equal(reference.receiver.type, "VariableReference");
  assert.equal(reference.member.lexeme, "Pending");
});

test("accepts forward enum types in every current type position", () => {
  const program = parse(`struct Holder {
  Status status
  tuple(Status, int) pair
  fn keep(Status|null value) returns Status|null {
    value
  }
}
fn identity(Status value) returns Status {
  value
}
enum Status {
  Pending
}`);

  const holder = program.statements[0]!.expression;
  const identity = program.statements[1]!.expression;

  assert.equal(holder.type, "StructDeclaration");
  assert.equal(identity.type, "FunctionDeclaration");
});

test("requires enum declarations to remain at the top level", () => {
  assert.throws(
    () =>
      parse(`fn invalid() returns null {
  enum Status {
    Pending
  }
}`),
    /Expected expression.*2:3/,
  );
});

test("requires at least one enum member", () => {
  assert.throws(() => parse("enum Status {\n}"), /require at least one member/);
});

test("requires enum members to be written one per line", () => {
  assert.throws(
    () => parse("enum Status {\n  Pending Running\n}"),
    /Expected a newline after enum member/,
  );
});

test("rejects commas and case-style member declarations", () => {
  assert.throws(
    () => parse("enum Status {\n  Pending,\n  Running\n}"),
    /Expected a newline after enum member/,
  );
  assert.throws(
    () => parse("enum Status {\n  case Pending\n}"),
    /Expected a newline after enum member/,
  );
});

test("rejects associated, raw, and backing values", () => {
  assert.throws(
    () => parse("enum Status {\n  Pending(str)\n}"),
    /Expected a newline after enum member/,
  );
  assert.throws(
    () => parse('enum Status {\n  Pending: "pending"\n}'),
    /Expected a newline after enum member/,
  );
  assert.throws(
    () => parse('enum Status {\n  Pending = "pending"\n}'),
    /Expected a newline after enum member/,
  );
  assert.throws(
    () => parse("enum Status: str {\n  Pending\n}"),
    /Expected '\{' after enum name/,
  );
});

test("reports duplicate member names with E_ENUM_MEMBER_DUP", () => {
  assert.throws(
    () => parse("enum Status {\n  Pending\n  Pending\n}"),
    /E_ENUM_MEMBER_DUP.*'Pending'/,
  );
});

test("rejects global identifiers as enum or member names", () => {
  assert.throws(
    () => parse("enum $Status { Pending }"),
    /Enum names cannot be global identifiers/,
  );
  assert.throws(
    () => parse("enum Status { $Pending }"),
    /Enum member names cannot be global identifiers/,
  );
});
