// Phase 6

import assert from "node:assert/strict";
import test from "node:test";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

function parse(source: string) {
  return new Parser(new Lexer(source).lex()).parse();
}

function evaluate(source: string): RuntimeValue {
  const program = parse(source);
  const environment = new Environment();

  return new Evaluator(environment).evaluate(program);
}

test("parses assignment as an expression", () => {
  const program = parse("value = 42");

  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      name: "value",
      value: {
        type: "IntegerLiteral",
        value: 42,
      },
    },
  });
});

test("returns the assigned global value", () => {
  assert.deepEqual(evaluate("$value = 42"), {
    type: "Integer",
    value: 42,
  });
});

test("rejects an ordinary variable assignment at the top level", () => {
  assert.throws(
    () => evaluate("value = 42"),
    /Top-level variable 'value' must use the '\$' global-variable prefix\./,
  );
});

test("supports chained assignment expressions", () => {
  assert.deepEqual(
    evaluate(`first = second = 42
first + second
`),
    {
      type: "Integer",
      value: 84,
    },
  );
});

test("assignment is right-associative", () => {
  const program = parse("first = second = 42");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.deepEqual(statement.expression, {
    type: "AssignmentExpression",
    name: "first",
    value: {
      type: "AssignmentExpression",
      name: "second",
      value: {
        type: "IntegerLiteral",
        value: 42,
      },
    },
  });
});

test("supports assignment inside arithmetic expressions", () => {
  assert.deepEqual(
    evaluate(`value = 0
result = (value = 5) + 2
result
`),
    {
      type: "Integer",
      value: 7,
    },
  );
});

test("supports assignment inside comparison expressions", () => {
  assert.deepEqual(
    evaluate(`value = 0
result = (value = 5) == 5
result
`),
    {
      type: "Boolean",
      value: true,
    },
  );
});

test("supports assignment inside logical expressions", () => {
  assert.deepEqual(
    evaluate(`value = false
result = (value = true) and true
result
`),
    {
      type: "Boolean",
      value: true,
    },
  );
});

test("supports assignment as a conditional condition", () => {
  assert.deepEqual(
    evaluate(`condition = false
result = if (condition = true) {
  1
} else {
  2
}
result
`),
    {
      type: "Integer",
      value: 1,
    },
  );
});

test("supports a conditional expression as an assignment value", () => {
  assert.deepEqual(
    evaluate(`value = if (true) {
  10
} else {
  20
}
value
`),
    {
      type: "Integer",
      value: 10,
    },
  );
});

test("supports assignment as the final branch expression", () => {
  assert.deepEqual(
    evaluate(`value = 0
result = if (true) {
  value = 10
}
result
`),
    {
      type: "Integer",
      value: 10,
    },
  );
});

test("assignment inside a branch updates the current environment", () => {
  assert.deepEqual(
    evaluate(`value = 0
if (true) {
  value = 10
}
value
`),
    {
      type: "Integer",
      value: 10,
    },
  );
});

test("does not evaluate an assignment in an unselected branch", () => {
  assert.deepEqual(
    evaluate(`value = 0
if (true) {
  1
} else {
  value = 10
}
value
`),
    {
      type: "Integer",
      value: 0,
    },
  );
});

test("rejects a literal as an assignment target", () => {
  assert.throws(() => parse("1 = 2"), /Invalid assignment target\. at 1:3/);
});

test("rejects a binary expression as an assignment target", () => {
  assert.throws(
    () => parse("(1 + 2) = 3"),
    /Invalid assignment target\. at 1:9/,
  );
});

test("rejects a missing assignment value", () => {
  assert.throws(() => parse("value ="), /Expected expression\./);
});
