// Phase 7
import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { TokenType } from "../src/token.js";
function parse(source: string) {
  return new Parser(new Lexer(source).lex()).parse();
}
test("parses a function declaration", () => {
  const program = parse(`fn add(left, right) {
  return left + right
}`);
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "FunctionDeclaration",
      keyword: {
        type: TokenType.Fn,
        lexeme: "fn",
        line: 1,
        column: 1,
      },
      name: {
        type: TokenType.Identifier,
        lexeme: "add",
        line: 1,
        column: 4,
      },
      parameters: [
        {
          type: TokenType.Identifier,
          lexeme: "left",
          line: 1,
          column: 8,
        },
        {
          type: TokenType.Identifier,
          lexeme: "right",
          line: 1,
          column: 14,
        },
      ],
      expressions: [
        {
          type: "ReturnExpression",
          keyword: {
            type: TokenType.Return,
            lexeme: "return",
            line: 2,
            column: 3,
          },
          value: {
            type: "BinaryExpression",
            left: {
              type: "VariableReference",
              name: "left",
            },
            operator: {
              type: TokenType.Plus,
              lexeme: "+",
              line: 2,
              column: 15,
            },
            right: {
              type: "VariableReference",
              name: "right",
            },
          },
        },
      ],
    },
  });
});
test("parses a function declaration without parameters", () => {
  const program = parse(`fn answer() {
  return 42
}`);
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  assert.equal(statement.expression.type, "FunctionDeclaration");
  if (statement.expression.type !== "FunctionDeclaration") {
    assert.fail("Expected a function declaration.");
  }
  assert.equal(statement.expression.name.lexeme, "answer");
  assert.deepEqual(statement.expression.parameters, []);
  assert.equal(statement.expression.expressions.length, 1);
});
test("parses multiple expressions inside a function body", () => {
  const program = parse(`fn calculate(value) {
  doubled = value * 2
  return doubled + 1
}`);
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  assert.equal(statement.expression.type, "FunctionDeclaration");
  if (statement.expression.type !== "FunctionDeclaration") {
    assert.fail("Expected a function declaration.");
  }
  assert.deepEqual(
    statement.expression.expressions.map((expression) => expression.type),
    ["AssignmentExpression", "ReturnExpression"],
  );
});
test("parses return without a value", () => {
  const program = parse(`fn stop() {
  return
}`);
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  assert.equal(statement.expression.type, "FunctionDeclaration");
  if (statement.expression.type !== "FunctionDeclaration") {
    assert.fail("Expected a function declaration.");
  }
  assert.deepEqual(statement.expression.expressions[0], {
    type: "ReturnExpression",
    keyword: {
      type: TokenType.Return,
      lexeme: "return",
      line: 2,
      column: 3,
    },
    value: null,
  });
});
test("parses a function call with its callee token", () => {
  const program = parse("add(1, 2)");
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "FunctionCall",
      callee: "add",
      calleeToken: {
        type: TokenType.Identifier,
        lexeme: "add",
        line: 1,
        column: 1,
      },
      arguments: [
        {
          type: "IntegerLiteral",
          value: 1,
        },
        {
          type: "IntegerLiteral",
          value: 2,
        },
      ],
    },
  });
});
test("parses a zero-argument function call with parentheses", () => {
  const program = parse("answer()");
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "FunctionCall",
      callee: "answer",
      calleeToken: {
        type: TokenType.Identifier,
        lexeme: "answer",
        line: 1,
        column: 1,
      },
      arguments: [],
    },
  });
});
test("parses a recursive function call", () => {
  const program = parse(`fn countdown(value) {
  if (value == 0) {
    return 0
  }
  return countdown(value - 1)
}`);
  const declarationStatement = program.statements[0];
  assert.equal(declarationStatement?.type, "ExpressionStatement");
  assert.equal(declarationStatement.expression.type, "FunctionDeclaration");
  if (declarationStatement.expression.type !== "FunctionDeclaration") {
    assert.fail("Expected a function declaration.");
  }
  const returnExpression = declarationStatement.expression.expressions[1];
  assert.equal(returnExpression?.type, "ReturnExpression");
  if (returnExpression?.type !== "ReturnExpression") {
    assert.fail("Expected a return expression.");
  }
  assert.equal(returnExpression.value?.type, "FunctionCall");
  if (returnExpression.value?.type !== "FunctionCall") {
    assert.fail("Expected a recursive function call.");
  }
  assert.equal(returnExpression.value.callee, "countdown");
  assert.equal(returnExpression.value.arguments.length, 1);
});
test("parses global variable access inside a function", () => {
  const program = parse(`fn increment() {
  $counter = $counter + 1
  return $counter
}`);
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  assert.equal(statement.expression.type, "FunctionDeclaration");
  if (statement.expression.type !== "FunctionDeclaration") {
    assert.fail("Expected a function declaration.");
  }
  assert.deepEqual(statement.expression.expressions[0], {
    type: "AssignmentExpression",
    name: "$counter",
    value: {
      type: "BinaryExpression",
      left: {
        type: "VariableReference",
        name: "$counter",
      },
      operator: {
        type: TokenType.Plus,
        lexeme: "+",
        line: 2,
        column: 23,
      },
      right: {
        type: "IntegerLiteral",
        value: 1,
      },
    },
  });
});
test("rejects duplicate parameter names", () => {
  assert.throws(
    () =>
      parse(`fn add(value, value) {
  return value
}`),
    /duplicate parameter|already defined/i,
  );
});
test("rejects an empty function body", () => {
  assert.throws(
    () =>
      parse(`fn empty() {
}`),
    /Function bodies cannot be empty\./,
  );
});
test("rejects a function declaration inside a function", () => {
  assert.throws(
    () =>
      parse(`fn outer() {
  fn inner() {
    return 1
  }
  return inner()
}`),
    /Expected expression\./,
  );
});
test("rejects a missing function name", () => {
  assert.throws(
    () =>
      parse(`fn (value) {
  return value
}`),
    /function name|identifier/i,
  );
});
test("rejects a missing opening parenthesis", () => {
  assert.throws(
    () =>
      parse(`fn add value) {
  return value
}`),
    /'\('|opening parenthesis/i,
  );
});
test("rejects a missing closing parenthesis", () => {
  assert.throws(
    () =>
      parse(`fn add(value {
  return value
}`),
    /'\)'|closing parenthesis/i,
  );
});
test("rejects a missing function body", () => {
  assert.throws(() => parse("fn add(value)"), /'\{'|function body/i);
});
