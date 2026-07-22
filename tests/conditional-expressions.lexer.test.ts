// Phase 6

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { TokenType } from "../src/token.js";

test("lexes Phase 6 keywords", () => {
  const tokens = new Lexer("if else null").lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.If,
        lexeme: "if",
      },
      {
        type: TokenType.Else,
        lexeme: "else",
      },
      {
        type: TokenType.Null,
        lexeme: "null",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});

test("lexes conditional braces", () => {
  const tokens = new Lexer("{ }").lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.LeftBrace,
        lexeme: "{",
      },
      {
        type: TokenType.RightBrace,
        lexeme: "}",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});

test("lexes a conditional expression", () => {
  const source = `if (true) {
  null
} else {
  false
}`;

  const tokens = new Lexer(source).lex();

  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.If,
      TokenType.LeftParen,
      TokenType.True,
      TokenType.RightParen,
      TokenType.LeftBrace,
      TokenType.Newline,
      TokenType.Null,
      TokenType.Newline,
      TokenType.RightBrace,
      TokenType.Else,
      TokenType.LeftBrace,
      TokenType.Newline,
      TokenType.False,
      TokenType.Newline,
      TokenType.RightBrace,
      TokenType.EOF,
    ],
  );
});

test("lexes else if as separate keywords", () => {
  const tokens = new Lexer("else if").lex();

  assert.deepEqual(
    tokens.map((token) => token.type),
    [TokenType.Else, TokenType.If, TokenType.EOF],
  );
});

test("tracks Phase 6 keyword and brace positions", () => {
  const source = `if (true) {
  null
} else {
  false
}`;

  const tokens = new Lexer(source).lex();

  const ifToken = tokens.find((token) => token.type === TokenType.If);
  const nullToken = tokens.find((token) => token.type === TokenType.Null);
  const elseToken = tokens.find((token) => token.type === TokenType.Else);
  const leftBraces = tokens.filter(
    (token) => token.type === TokenType.LeftBrace,
  );
  const rightBraces = tokens.filter(
    (token) => token.type === TokenType.RightBrace,
  );

  assert.deepEqual(
    {
      line: ifToken?.line,
      column: ifToken?.column,
    },
    {
      line: 1,
      column: 1,
    },
  );

  assert.deepEqual(
    {
      line: nullToken?.line,
      column: nullToken?.column,
    },
    {
      line: 2,
      column: 3,
    },
  );

  assert.deepEqual(
    {
      line: elseToken?.line,
      column: elseToken?.column,
    },
    {
      line: 3,
      column: 3,
    },
  );

  assert.deepEqual(
    leftBraces.map((token) => ({
      line: token.line,
      column: token.column,
    })),
    [
      {
        line: 1,
        column: 11,
      },
      {
        line: 3,
        column: 8,
      },
    ],
  );

  assert.deepEqual(
    rightBraces.map((token) => ({
      line: token.line,
      column: token.column,
    })),
    [
      {
        line: 3,
        column: 1,
      },
      {
        line: 5,
        column: 1,
      },
    ],
  );
});

test("keeps names containing Phase 6 keywords as identifiers", () => {
  const tokens = new Lexer(
    "iffy elsewhere nullable if_value else2 nullResult",
  ).lex();

  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Identifier,
        lexeme: "iffy",
      },
      {
        type: TokenType.Identifier,
        lexeme: "elsewhere",
      },
      {
        type: TokenType.Identifier,
        lexeme: "nullable",
      },
      {
        type: TokenType.Identifier,
        lexeme: "if_value",
      },
      {
        type: TokenType.Identifier,
        lexeme: "else2",
      },
      {
        type: TokenType.Identifier,
        lexeme: "nullResult",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
