import assert from "node:assert/strict";
import test from "node:test";

import { registerBuiltins } from "../src/builtins.js";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

test("executes the complete Phase 1 example", () => {
  const source = `answer = 42
print(answer)
`;

  const output: unknown[][] = [];
  const originalConsoleLog = console.log;

  console.log = (...arguments_: unknown[]) => {
    output.push(arguments_);
  };

  try {
    const tokens = new Lexer(source).lex();
    const program = new Parser(tokens).parse();

    const environment = new Environment();
    registerBuiltins(environment);

    const evaluator = new Evaluator(environment);
    evaluator.evaluate(program);
  } finally {
    console.log = originalConsoleLog;
  }

  assert.deepEqual(output, [["42"]]);
});