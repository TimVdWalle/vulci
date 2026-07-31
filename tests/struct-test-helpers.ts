// Phase 13

import { registerBuiltins } from "../src/builtins.js";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { Program } from "../src/ast.js";
import { RuntimeValue } from "../src/runtime-value.js";

export function parseStructSource(source: string): Program {
  return new Parser(new Lexer(source).lex()).parse();
}

export function evaluateStructSource(
  source: string,
  environment = new Environment(),
): RuntimeValue {
  return new Evaluator(environment).evaluate(parseStructSource(source));
}

export function evaluateStructSourceWithBuiltins(source: string): RuntimeValue {
  const environment = new Environment();
  registerBuiltins(environment);
  return evaluateStructSource(source, environment);
}
