import assert from "node:assert/strict";
import test from "node:test";

import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

test("lexes a Phase 1 program", () => {
  const source = `answer = 42
print(answer)
`;

  const tokens = new Lexer(source).lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Identifier,
        lexeme: "answer",
      },
      {
        type: TokenType.Assign,
        lexeme: "=",
      },
      {
        type: TokenType.Integer,
        lexeme: "42",
      },
      {
        type: TokenType.Newline,
        lexeme: "\n",
      },
      {
        type: TokenType.Identifier,
        lexeme: "print",
      },
      {
        type: TokenType.LeftParen,
        lexeme: "(",
      },
      {
        type: TokenType.Identifier,
        lexeme: "answer",
      },
      {
        type: TokenType.RightParen,
        lexeme: ")",
      },
      {
        type: TokenType.Newline,
        lexeme: "\n",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ]
  );
});

test("ignores comments", () => {
  const source = `// comment
answer = 42 // trailing comment
`;

  const tokens = new Lexer(source).lex();

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.Assign,
      TokenType.Integer,
      TokenType.Newline,
      TokenType.EOF,
    ]
  );
});

test("lexes identifiers containing underscores and numbers", () => {
  const tokens = new Lexer("answer_2 = 42").lex();

  assert.equal(tokens[0]?.type, TokenType.Identifier);
  assert.equal(tokens[0]?.lexeme, "answer_2");
});

test("reports unexpected characters with their position", () => {
  assert.throws(
    () => new Lexer("answer = @").lex(),
    /Unexpected character '@' at 1:10/
  );
});