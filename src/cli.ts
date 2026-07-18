#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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

        // TODO:
        // const tokens = lex(source);
        // const ast = parse(tokens);
        // evaluate(ast);

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