// Phase 11

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

test("lexes bracket tokens", () => {
  const tokens = new Lexer("value[1]").lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Identifier,
      TokenType.LeftBracket,
      TokenType.Integer,
      TokenType.RightBracket,
      TokenType.EOF,
    ],
  );
});
