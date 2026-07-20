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
    ],
  );
});
test("ignores line comments", () => {
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
    ],
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
    /Unexpected character '@' at 1:10/,
  );
});
test("lexes arithmetic operators", () => {
  const tokens = new Lexer("+ - * / %").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Plus,
        lexeme: "+",
      },
      {
        type: TokenType.Minus,
        lexeme: "-",
      },
      {
        type: TokenType.Star,
        lexeme: "*",
      },
      {
        type: TokenType.Slash,
        lexeme: "/",
      },
      {
        type: TokenType.Percent,
        lexeme: "%",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("distinguishes division from line comments", () => {
  const source = `result = 10 / 2
// comment
remainder = 10 % 3
`;
  const tokens = new Lexer(source).lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Identifier,
      TokenType.Assign,
      TokenType.Integer,
      TokenType.Slash,
      TokenType.Integer,
      TokenType.Newline,
      TokenType.Newline,
      TokenType.Identifier,
      TokenType.Assign,
      TokenType.Integer,
      TokenType.Percent,
      TokenType.Integer,
      TokenType.Newline,
      TokenType.EOF,
    ],
  );
});
test("ignores a block comment", () => {
  const tokens = new Lexer("1 /* comment */ + 2").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Integer,
        lexeme: "1",
      },
      {
        type: TokenType.Plus,
        lexeme: "+",
      },
      {
        type: TokenType.Integer,
        lexeme: "2",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("allows block comments between tokens", () => {
  const tokens = new Lexer("1 + /* explanation */ 2").lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [TokenType.Integer, TokenType.Plus, TokenType.Integer, TokenType.EOF],
  );
});
test("does not emit newlines inside block comments", () => {
  const source = `1 + /*
first line
second line
*/ 2`;
  const tokens = new Lexer(source).lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [TokenType.Integer, TokenType.Plus, TokenType.Integer, TokenType.EOF],
  );
});
test("tracks source positions after multiline block comments", () => {
  const source = `1 + /*
first line
second line
*/ 2`;
  const tokens = new Lexer(source).lex();
  const finalInteger = tokens[2];
  assert.equal(finalInteger?.type, TokenType.Integer);
  assert.equal(finalInteger?.lexeme, "2");
  assert.equal(finalInteger?.line, 4);
  assert.equal(finalInteger?.column, 4);
});
test("supports nested block comments", () => {
  const tokens = new Lexer("1 + /* outer /* inner */ outer */ 2").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Integer,
        lexeme: "1",
      },
      {
        type: TokenType.Plus,
        lexeme: "+",
      },
      {
        type: TokenType.Integer,
        lexeme: "2",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("supports multiple levels of nested block comments", () => {
  const source = `1 + /*
level 1
/* level 2
/* level 3 */
level 2 */
level 1 */ 2`;
  const tokens = new Lexer(source).lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [TokenType.Integer, TokenType.Plus, TokenType.Integer, TokenType.EOF],
  );
});
test("tracks source positions after nested multiline block comments", () => {
  const source = `1 + /*
outer
/* inner */
outer
*/ 2`;
  const tokens = new Lexer(source).lex();
  const finalInteger = tokens[2];
  assert.equal(finalInteger?.type, TokenType.Integer);
  assert.equal(finalInteger?.lexeme, "2");
  assert.equal(finalInteger?.line, 5);
  assert.equal(finalInteger?.column, 4);
});
test("reports an unterminated block comment at its opening delimiter", () => {
  assert.throws(
    () =>
      new Lexer(`1 + /*
unfinished`).lex(),
    /Unterminated block comment at 1:5/,
  );
});
test("reports an unterminated nested block comment at the outer opening delimiter", () => {
  assert.throws(
    () => new Lexer("1 + /* outer /* inner */ still outer").lex(),
    /Unterminated block comment at 1:5/,
  );
});
test("treats documentation-style comments as ordinary comments", () => {
  const source = `/// line documentation comment
1 + /** block documentation comment */ 2`;
  const tokens = new Lexer(source).lex();
  assert.deepEqual(
    tokens.map((token) => token.type),
    [
      TokenType.Newline,
      TokenType.Integer,
      TokenType.Plus,
      TokenType.Integer,
      TokenType.EOF,
    ],
  );
});
test("does not combine tokens separated by comments", () => {
  const tokens = new Lexer("1/* comment */000").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Integer,
        lexeme: "1",
      },
      {
        type: TokenType.Integer,
        lexeme: "000",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("lexes integers containing valid separators", () => {
  const tokens = new Lexer("1_000 1_000_000").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Integer,
        lexeme: "1_000",
      },
      {
        type: TokenType.Integer,
        lexeme: "1_000_000",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("reports an integer separator before the first digit", () => {
  assert.throws(
    () => new Lexer("_10").lex(),
    /Invalid integer separator at 1:1/,
  );
});
test("reports an integer separator after the final digit", () => {
  assert.throws(
    () => new Lexer("100_").lex(),
    /Invalid integer separator at 1:4/,
  );
});
test("reports consecutive integer separators", () => {
  assert.throws(
    () => new Lexer("1__000").lex(),
    /Invalid integer separator at 1:2/,
  );
});
test("reports invalid separators at their source position", () => {
  assert.throws(
    () => new Lexer("value = 1__000").lex(),
    /Invalid integer separator at 1:10/,
  );
});
test("lexes Boolean literals", () => {
  const tokens = new Lexer("true false").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.True,
        lexeme: "true",
      },
      {
        type: TokenType.False,
        lexeme: "false",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("keeps names containing Boolean keywords as identifiers", () => {
  const tokens = new Lexer("trueValue false_value true2 false2").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Identifier,
        lexeme: "trueValue",
      },
      {
        type: TokenType.Identifier,
        lexeme: "false_value",
      },
      {
        type: TokenType.Identifier,
        lexeme: "true2",
      },
      {
        type: TokenType.Identifier,
        lexeme: "false2",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("lexes assignment and comparison operators", () => {
  const tokens = new Lexer("= == != < <= > >=").lex();
  assert.deepEqual(
    tokens.map((token) => ({
      type: token.type,
      lexeme: token.lexeme,
    })),
    [
      {
        type: TokenType.Assign,
        lexeme: "=",
      },
      {
        type: TokenType.EqualEqual,
        lexeme: "==",
      },
      {
        type: TokenType.BangEqual,
        lexeme: "!=",
      },
      {
        type: TokenType.Less,
        lexeme: "<",
      },
      {
        type: TokenType.LessEqual,
        lexeme: "<=",
      },
      {
        type: TokenType.Greater,
        lexeme: ">",
      },
      {
        type: TokenType.GreaterEqual,
        lexeme: ">=",
      },
      {
        type: TokenType.EOF,
        lexeme: "",
      },
    ],
  );
});
test("tracks comparison operator source positions", () => {
  const tokens = new Lexer(`1 == 2
3 != 4
5 <= 6
7 > 6
8 >= 8`).lex();
  const equal = tokens.find((token) => token.type === TokenType.EqualEqual);
  const notEqual = tokens.find((token) => token.type === TokenType.BangEqual);
  const lessEqual = tokens.find((token) => token.type === TokenType.LessEqual);
  const greater = tokens.find((token) => token.type === TokenType.Greater);
  const greaterEqual = tokens.find(
    (token) => token.type === TokenType.GreaterEqual,
  );
  assert.deepEqual(
    {
      lexeme: equal?.lexeme,
      line: equal?.line,
      column: equal?.column,
    },
    {
      lexeme: "==",
      line: 1,
      column: 3,
    },
  );
  assert.deepEqual(
    {
      lexeme: notEqual?.lexeme,
      line: notEqual?.line,
      column: notEqual?.column,
    },
    {
      lexeme: "!=",
      line: 2,
      column: 3,
    },
  );
  assert.deepEqual(
    {
      lexeme: lessEqual?.lexeme,
      line: lessEqual?.line,
      column: lessEqual?.column,
    },
    {
      lexeme: "<=",
      line: 3,
      column: 3,
    },
  );
  assert.deepEqual(
    {
      lexeme: greater?.lexeme,
      line: greater?.line,
      column: greater?.column,
    },
    {
      lexeme: ">",
      line: 4,
      column: 3,
    },
  );
  assert.deepEqual(
    {
      lexeme: greaterEqual?.lexeme,
      line: greaterEqual?.line,
      column: greaterEqual?.column,
    },
    {
      lexeme: ">=",
      line: 5,
      column: 3,
    },
  );
});
test("reports a standalone exclamation mark", () => {
  assert.throws(() => new Lexer("!").lex(), /Unexpected character '!' at 1:1/);
});
