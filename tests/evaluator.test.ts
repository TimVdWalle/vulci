import assert from "node:assert/strict";
import test from "node:test";

import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";

function evaluate(source: string, environment: Environment): void {
  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();
  const evaluator = new Evaluator(environment);

  evaluator.evaluate(program);
}

test("stores and retrieves variables", () => {
  const environment = new Environment();

  evaluate("answer = 42", environment);

  assert.deepEqual(environment.get("answer"), {
    type: "Integer",
    value: 42,
  });
});

test("calls native functions with evaluated arguments", () => {
  const environment = new Environment();
  let receivedArguments: unknown;

  environment.define("capture", {
    type: "NativeFunction",

    call(arguments_) {
      receivedArguments = arguments_;

      return {
        type: "Null",
      };
    },
  });

  evaluate(
    `answer = 42
capture(answer)
`,
    environment,
  );

  assert.deepEqual(receivedArguments, [
    {
      type: "Integer",
      value: 42,
    },
  ]);
});

test("reports undefined variables", () => {
  const environment = new Environment();

  assert.throws(
    () => evaluate("print(answer)", environment),
    /Undefined variable 'print'/,
  );
});

test("reports values that are not callable", () => {
  const environment = new Environment();

  assert.throws(
    () =>
      evaluate(
        `answer = 42
answer()
`,
        environment,
      ),
    /'answer' is not callable/,
  );
});
