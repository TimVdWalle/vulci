#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Lexer } from "./lexer.js";
import { TokenType } from "./token.js";
import { Parser } from "./parser.js";

async function main(): Promise<void> {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error("Usage: vulci <file.vulci>");
        process.exit(1);
    }

    try {
        const source = await readFile(resolve(filePath), "utf8");

        console.log("=== Vulci ===");
        console.log(source);

        const lexer = new Lexer(source);

        const tokens = lexer.lex();

           const parser = new Parser(tokens);

        const program = parser.parse();

        console.dir(program, {

            depth: null,

            colors: true,

        })

       console.table(

    tokens.map((token) => ({

        type: TokenType[token.type],

        lexeme: token.lexeme === "" ? "<empty>" : token.lexeme,

        line: token.line,

        column: token.column,

    }))

);

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error.");
        }

        process.exit(1);
    }
}

void main();