// Phase 13

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

function tokenTypes(source: string): TokenType[] {
  return new Lexer(source).lex().map((token) => token.type);
}

test("lexes struct as a keyword", () => {
  const tokens = new Lexer("struct User {}").lex();

  assert.equal(tokens[0]?.type, TokenType.Struct);
  assert.equal(tokens[0]?.lexeme, "struct");
  assert.equal(tokens[1]?.type, TokenType.Identifier);
  assert.equal(tokens[1]?.lexeme, "User");
});

test("keeps self and struct member names as identifiers", () => {
  const tokens = new Lexer("self.value").lex();

  assert.deepEqual(
    tokens.slice(0, 3).map((token) => token.type),
    [TokenType.Identifier, TokenType.Dot, TokenType.Identifier],
  );
});

test("lexes declarations, defaults, construction, and member calls", () => {
  assert.deepEqual(
    tokenTypes(`struct Counter {
  int value = 0
}
Counter(value: 1).increment(by: 2)`),
    [
      TokenType.Struct,
      TokenType.Identifier,
      TokenType.LeftBrace,
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.Identifier,
      TokenType.Assign,
      TokenType.Integer,
      TokenType.Newline,
      TokenType.RightBrace,
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.LeftParen,
      TokenType.Identifier,
      TokenType.Colon,
      TokenType.Integer,
      TokenType.RightParen,
      TokenType.Dot,
      TokenType.Identifier,
      TokenType.LeftParen,
      TokenType.Identifier,
      TokenType.Colon,
      TokenType.Integer,
      TokenType.RightParen,
      TokenType.EOF,
    ],
  );
});
