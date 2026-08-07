// Phase 14

import { Program } from "../../../../../Downloads/vulci-phase14/src/ast.js";
import { registerBuiltins } from "../src/builtins.js";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

export function parseEnumSource(source: string): Program {
  return new Parser(new Lexer(source).lex()).parse();
}

export function evaluateEnumSource(
  source: string,
  environment = new Environment(),
): RuntimeValue {
  return new Evaluator(environment).evaluate(parseEnumSource(source));
}

export function evaluateEnumSourceWithBuiltins(source: string): RuntimeValue {
  const environment = new Environment();
  registerBuiltins(environment);
  return evaluateEnumSource(source, environment);
}
