// Phase 8

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

test("lexes returns as a keyword", () => {
  const tokens = new Lexer("returns").lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Returns,
        lexeme: "returns",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});

test("lexes the union separator", () => {
  const tokens = new Lexer("int|bool").lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Identifier,
        lexeme: "int",
      },
      {
        type: TokenType.Pipe,
        lexeme: "|",
      },
      {
        type: TokenType.Identifier,
        lexeme: "bool",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});

test("records no whitespace around a compact union separator", () => {
  const tokens = new Lexer("int|bool").lex();
  const separator = tokens.find((token) => token.type === TokenType.Pipe);

  assert.ok(separator);
  assert.equal(separator.whitespaceBefore, false);
  assert.equal(separator.whitespaceAfter, false);
});

test("records whitespace before a union separator", () => {
  const tokens = new Lexer("int |bool").lex();
  const separator = tokens.find((token) => token.type === TokenType.Pipe);

  assert.ok(separator);
  assert.equal(separator.whitespaceBefore, true);
  assert.equal(separator.whitespaceAfter, false);
});

test("records whitespace after a union separator", () => {
  const tokens = new Lexer("int| bool").lex();
  const separator = tokens.find((token) => token.type === TokenType.Pipe);

  assert.ok(separator);
  assert.equal(separator.whitespaceBefore, false);
  assert.equal(separator.whitespaceAfter, true);
});

test("records whitespace on both sides of a union separator", () => {
  const tokens = new Lexer("int | bool").lex();
  const separator = tokens.find((token) => token.type === TokenType.Pipe);

  assert.ok(separator);
  assert.equal(separator.whitespaceBefore, true);
  assert.equal(separator.whitespaceAfter, true);
});

test("lexes a typed function declaration", () => {
  const tokens = new Lexer(
    "fn preserve(int|bool value) returns int|null",
  ).lex();

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Fn,
      TokenType.Identifier,
      TokenType.LeftParen,
      TokenType.Identifier,
      TokenType.Pipe,
      TokenType.Identifier,
      TokenType.Identifier,
      TokenType.RightParen,
      TokenType.Returns,
      TokenType.Identifier,
      TokenType.Pipe,
      TokenType.Null,
      TokenType.EOF,
    ],
  );
});

test("continues to lex null as the null keyword", () => {
  const tokens = new Lexer("null").lex();

  assert.equal(tokens[0]?.type, TokenType.Null);
  assert.equal(tokens[0]?.lexeme, "null");
});
