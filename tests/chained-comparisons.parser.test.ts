// Phase 6

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { TokenType } from "../src/token.js";

function parse(source: string) {
  return new Parser(new Lexer(source).lex()).parse();
}

test("parses an ordering comparison chain", () => {
  const program = parse("1 < 2 <= 3");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.deepEqual(statement.expression, {
    type: "ComparisonChainExpression",
    operands: [
      {
        type: "IntegerLiteral",
        value: 1,
      },
      {
        type: "IntegerLiteral",
        value: 2,
      },
      {
        type: "IntegerLiteral",
        value: 3,
      },
    ],
    operators: [
      {
        type: TokenType.Less,
        lexeme: "<",
        line: 1,
        column: 3,
      },
      {
        type: TokenType.LessEqual,
        lexeme: "<=",
        line: 1,
        column: 7,
      },
    ],
  });
});

test("parses an equality comparison chain", () => {
  const program = parse("1 == 1 != 2");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.equal(statement.expression.type, "ComparisonChainExpression");

  if (statement.expression.type !== "ComparisonChainExpression") {
    assert.fail("Expected a comparison-chain expression.");
  }

  assert.deepEqual(
    statement.expression.operators.map((operator) => operator.type),
    [TokenType.EqualEqual, TokenType.BangEqual],
  );
});

test("parses all ordering operators in one chain", () => {
  const program = parse("1 < 2 <= 3 > 2 >= 1");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.equal(statement.expression.type, "ComparisonChainExpression");

  if (statement.expression.type !== "ComparisonChainExpression") {
    assert.fail("Expected a comparison-chain expression.");
  }

  assert.deepEqual(
    statement.expression.operators.map((operator) => operator.type),
    [
      TokenType.Less,
      TokenType.LessEqual,
      TokenType.Greater,
      TokenType.GreaterEqual,
    ],
  );
});

test("keeps a single comparison as a binary expression", () => {
  const program = parse("1 < 2");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.equal(statement.expression.type, "BinaryExpression");
});

test("parses arithmetic operands before chained comparisons", () => {
  const program = parse("1 + 1 < 2 * 2 <= 8 / 2");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.equal(statement.expression.type, "ComparisonChainExpression");

  if (statement.expression.type !== "ComparisonChainExpression") {
    assert.fail("Expected a comparison-chain expression.");
  }

  assert.deepEqual(
    statement.expression.operands.map((operand) => operand.type),
    ["BinaryExpression", "BinaryExpression", "BinaryExpression"],
  );
});

test("allows parentheses to separate comparison categories", () => {
  const program = parse("(1 < 2) == true");
  const statement = program.statements[0];

  assert.equal(statement?.type, "ExpressionStatement");

  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }

  assert.equal(statement.expression.type, "BinaryExpression");

  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }

  assert.equal(statement.expression.operator.type, TokenType.EqualEqual);

  assert.equal(statement.expression.left.type, "BinaryExpression");
});

test("rejects ordering followed by equality in one chain", () => {
  assert.throws(
    () => parse("1 < 2 == true"),
    /Equality and ordering operators cannot be mixed in one comparison chain\. at 1:7/,
  );
});

test("rejects equality followed by ordering in one chain", () => {
  assert.throws(
    () => parse("1 != 2 >= 3"),
    /Equality and ordering operators cannot be mixed in one comparison chain\. at 1:8/,
  );
});

test("reports the first operator that changes chain category", () => {
  assert.throws(
    () => parse("1 < 2 <= 3 == true"),
    /Equality and ordering operators cannot be mixed in one comparison chain\. at 1:12/,
  );
});
