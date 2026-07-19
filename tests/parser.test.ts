import assert from "node:assert/strict";
import test from "node:test";

import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

test("parses a Phase 1 program", () => {
  const source = `answer = 42
print(answer)
`;

  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();

  assert.deepEqual(program, {
    type: "Program",
    statements: [
      {
        type: "VariableAssignment",
        name: "answer",
        value: {
          type: "IntegerLiteral",
          value: 42,
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "FunctionCall",
          callee: "print",
          arguments: [
            {
              type: "VariableReference",
              name: "answer",
            },
          ],
        },
      },
    ],
  });
});

test("parses function calls with multiple arguments", () => {
  const tokens = new Lexer("print(1, 2)").lex();
  const program = new Parser(tokens).parse();

  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "FunctionCall",
      callee: "print",
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

test("requires a newline between statements", () => {
  const tokens = new Lexer("answer = 42 print(answer)").lex();

  assert.throws(
    () => new Parser(tokens).parse(),
    /Expected a newline after statement/
  );
});