// Phase 14

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

function tokenTypes(source: string): TokenType[] {
  return new Lexer(source).lex().map((token) => token.type);
}

test("lexes enum as a reserved keyword", () => {
  const tokens = new Lexer("enum Status").lex();

  assert.equal(tokens[0]?.type, TokenType.Enum);
  assert.equal(tokens[0]?.lexeme, "enum");
  assert.equal(tokens[1]?.type, TokenType.Identifier);
  assert.equal(tokens[1]?.lexeme, "Status");
});

test("keeps enum member names as identifiers", () => {
  assert.deepEqual(tokenTypes("Status.Pending"), [
    TokenType.Identifier,
    TokenType.Dot,
    TokenType.Identifier,
    TokenType.EOF,
  ]);
});

test("lexes the canonical enum declaration form", () => {
  assert.deepEqual(
    tokenTypes(`enum Status {
  Pending
  Running
}`),
    [
      TokenType.Enum,
      TokenType.Identifier,
      TokenType.LeftBrace,
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.Newline,
      TokenType.RightBrace,
      TokenType.EOF,
    ],
  );
});
