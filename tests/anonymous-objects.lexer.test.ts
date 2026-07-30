// Phase 12

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

test("lexes anonymous-object syntax using existing tokens", () => {
  const tokens = new Lexer('object(name: "Tim", age: 30)').lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Identifier,
      TokenType.LeftParen,
      TokenType.Identifier,
      TokenType.Colon,
      TokenType.String,
      TokenType.Comma,
      TokenType.Identifier,
      TokenType.Colon,
      TokenType.Integer,
      TokenType.RightParen,
      TokenType.EOF,
    ],
  );
});
