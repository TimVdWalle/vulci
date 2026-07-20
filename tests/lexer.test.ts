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