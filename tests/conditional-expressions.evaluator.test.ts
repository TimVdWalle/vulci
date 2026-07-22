// Phase 6

import assert from "node:assert/strict";
import test from "node:test";
import { Environment } from "../src/environment.js";
import { Evaluator } from "../src/evaluator.js";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { RuntimeValue } from "../src/runtime-value.js";

function evaluate(source: string): RuntimeValue {
  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();
  const environment = new Environment();

  return new Evaluator(environment).evaluate(program);
}

test("evaluates the if branch when its condition is true", () => {
  assert.deepEqual(
    evaluate(`if (true) {
  1
}`),
    {
      type: "Integer",
      value: 1,
    },
  );
});

test("returns null when no branch matches and else is absent", () => {
  assert.deepEqual(
    evaluate(`if (false) {
  1
}`),
    {
      type: "Null",
    },
  );
});

test("evaluates the else branch when the if condition is false", () => {
  assert.deepEqual(
    evaluate(`if (false) {
  1
} else {
  2
}`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("evaluates else if conditions in source order", () => {
  assert.deepEqual(
    evaluate(`if (false) {
  1
} else if (true) {
  2
} else if (true) {
  3
} else {
  4
}`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("evaluates the else branch when no condition matches", () => {
  assert.deepEqual(
    evaluate(`if (false) {
  1
} else if (false) {
  2
} else {
  3
}`),
    {
      type: "Integer",
      value: 3,
    },
  );
});

test("uses the final branch expression as the conditional result", () => {
  assert.deepEqual(
    evaluate(`if (true) {
  1
  2
  3
}`),
    {
      type: "Integer",
      value: 3,
    },
  );
});

test("assignment is an expression inside a branch", () => {
  assert.deepEqual(
    evaluate(`value = if (true) {
  result = 10
  result + 1
}
value
`),
    {
      type: "Integer",
      value: 11,
    },
  );
});

test("assignments inside a branch affect the current environment", () => {
  assert.deepEqual(
    evaluate(`value = 1
result = if (true) {
  value = 10
  value
}
value
`),
    {
      type: "Integer",
      value: 10,
    },
  );
});

test("does not evaluate an unselected else branch", () => {
  assert.deepEqual(
    evaluate(`if (true) {
  1
} else {
  1 / 0
}`),
    {
      type: "Integer",
      value: 1,
    },
  );
});

test("does not evaluate an unselected if branch", () => {
  assert.deepEqual(
    evaluate(`if (false) {
  1 / 0
} else {
  2
}`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("does not evaluate later else if conditions after a match", () => {
  assert.deepEqual(
    evaluate(`if (true) {
  1
} else if (1 / 0 == 0) {
  2
} else {
  3
}`),
    {
      type: "Integer",
      value: 1,
    },
  );
});

test("does not evaluate later branch bodies after a match", () => {
  const source = `value = 0
result = if (true) {
  1
} else if (true) {
  value = 10
  2
} else {
  value = 20
  3
}
value
`;

  assert.deepEqual(evaluate(source), {
    type: "Integer",
    value: 0,
  });
});

test("supports nested conditional expressions", () => {
  assert.deepEqual(
    evaluate(`if (true) {
  if (false) {
    1
  } else {
    2
  }
}`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("supports conditional expressions as assignment values", () => {
  assert.deepEqual(
    evaluate(`value = if (false) {
  1
} else {
  2
}
value
`),
    {
      type: "Integer",
      value: 2,
    },
  );
});

test("supports conditional expressions as function arguments", () => {
  const environment = new Environment();
  const output: RuntimeValue[] = [];

  environment.define("capture", {
    type: "NativeFunction",
    call(arguments_: RuntimeValue[]): RuntimeValue {
      output.push(...arguments_);
      return {
        type: "Null",
      };
    },
  });

  const source = `capture(if (true) {
  42
} else {
  0
})`;

  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();

  new Evaluator(environment).evaluate(program);

  assert.deepEqual(output, [
    {
      type: "Integer",
      value: 42,
    },
  ]);
});

test("rejects an Integer condition", () => {
  assert.throws(
    () =>
      evaluate(`if (1) {
  1
}`),
    /Conditional expression requires a Boolean condition\. at 1:1/,
  );
});

test("rejects a null condition", () => {
  assert.throws(
    () =>
      evaluate(`if (null) {
  1
}`),
    /Conditional expression requires a Boolean condition\. at 1:1/,
  );
});

test("rejects an invalid else if condition at its if keyword", () => {
  assert.throws(
    () =>
      evaluate(`if (false) {
  1
} else if (10) {
  2
} else {
  3
}`),
    /Conditional expression requires a Boolean condition\. at 3:8/,
  );
});

test("evaluates conditions from left to right", () => {
  const source = `value = 0
result = if ((value = value + 1) == 2) {
  1
} else if ((value = value + 1) == 2) {
  2
} else {
  3
}
value
`;

  assert.deepEqual(evaluate(source), {
    type: "Integer",
    value: 2,
  });
});

test("stops evaluating conditions after the first matching branch", () => {
  const source = `value = 0
result = if (true) {
  1
} else if ((value = 1) == 1) {
  2
}
value
`;

  assert.deepEqual(evaluate(source), {
    type: "Integer",
    value: 0,
  });
});
