import { readFile } from "node:fs/promises";
import { registerBuiltins } from "./builtins.js";
import { Environment } from "./environment.js";
import { Evaluator } from "./evaluator.js";
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";

async function main(): Promise<void> {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: vulci <file>");
    process.exitCode = 1;
    return;
  }

  try {
    const source = await readFile(filePath, "utf8");

    const lexer = new Lexer(source);
    const tokens = lexer.lex();

    const parser = new Parser(tokens);
    const program = parser.parse();

    const environment = new Environment();
    registerBuiltins(environment);

    const evaluator = new Evaluator(environment);
    evaluator.evaluate(program);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred.");
    }

    process.exitCode = 1;
  }
}

void main();
