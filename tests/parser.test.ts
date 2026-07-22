// Phase 6

import assert from "node:assert/strict";
import test from "node:test";
import { Lexer } from "../src/lexer.js";
import { Parser } from "../src/parser.js";
import { TokenType } from "../src/token.js";
test("parses a Phase 1 program", () => {
  const source = `answer = 42
print(answer)
`;
  const tokens = new Lexer(source).lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program, {
    type: "Program",
    statements: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          name: "answer",
          value: {
            type: "IntegerLiteral",
            value: 42,
          },
        },
      },
      {
        type: "ExpressionStatement",
        expression: {
          type: "FunctionCall",
          callee: "print",
          arguments: [
            {
              type: "VariableReference",
              name: "answer",
            },
          ],
        },
      },
    ],
  });
});
test("parses function calls with multiple arguments", () => {
  const tokens = new Lexer("print(1, 2)").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "FunctionCall",
      callee: "print",
      arguments: [
        {
          type: "IntegerLiteral",
          value: 1,
        },
        {
          type: "IntegerLiteral",
          value: 2,
        },
      ],
    },
  });
});
test("requires a newline between statements", () => {
  const tokens = new Lexer("answer = 42 print(answer)").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Expected a newline after statement/,
  );
});
test("parses integer separators", () => {
  const tokens = new Lexer("1_000_000").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "IntegerLiteral",
      value: 1_000_000,
    },
  });
});
test("parses unary negation", () => {
  const tokens = new Lexer("-42").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "UnaryExpression",
      operator: {
        type: TokenType.Minus,
        lexeme: "-",
        line: 1,
        column: 1,
      },
      operand: {
        type: "IntegerLiteral",
        value: 42,
      },
    },
  });
});
test("parses multiplication before addition", () => {
  const tokens = new Lexer("1 + 2 * 3").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BinaryExpression",
      left: {
        type: "IntegerLiteral",
        value: 1,
      },
      operator: {
        type: TokenType.Plus,
        lexeme: "+",
        line: 1,
        column: 3,
      },
      right: {
        type: "BinaryExpression",
        left: {
          type: "IntegerLiteral",
          value: 2,
        },
        operator: {
          type: TokenType.Star,
          lexeme: "*",
          line: 1,
          column: 7,
        },
        right: {
          type: "IntegerLiteral",
          value: 3,
        },
      },
    },
  });
});
test("parses parentheses before multiplication", () => {
  const tokens = new Lexer("(1 + 2) * 3").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BinaryExpression",
      left: {
        type: "BinaryExpression",
        left: {
          type: "IntegerLiteral",
          value: 1,
        },
        operator: {
          type: TokenType.Plus,
          lexeme: "+",
          line: 1,
          column: 4,
        },
        right: {
          type: "IntegerLiteral",
          value: 2,
        },
      },
      operator: {
        type: TokenType.Star,
        lexeme: "*",
        line: 1,
        column: 9,
      },
      right: {
        type: "IntegerLiteral",
        value: 3,
      },
    },
  });
});
test("parses addition and subtraction left-associatively", () => {
  const tokens = new Lexer("10 - 3 + 2").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BinaryExpression",
      left: {
        type: "BinaryExpression",
        left: {
          type: "IntegerLiteral",
          value: 10,
        },
        operator: {
          type: TokenType.Minus,
          lexeme: "-",
          line: 1,
          column: 4,
        },
        right: {
          type: "IntegerLiteral",
          value: 3,
        },
      },
      operator: {
        type: TokenType.Plus,
        lexeme: "+",
        line: 1,
        column: 8,
      },
      right: {
        type: "IntegerLiteral",
        value: 2,
      },
    },
  });
});
test("parses multiplication, division, and remainder left-associatively", () => {
  const tokens = new Lexer("20 / 5 * 2 % 3").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Percent);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Star);
  assert.equal(statement.expression.left.left.type, "BinaryExpression");
  if (statement.expression.left.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.left.operator.type, TokenType.Slash);
});
test("parses negation with higher precedence than multiplication", () => {
  const tokens = new Lexer("-2 * 3").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Star);
  assert.equal(statement.expression.left.type, "UnaryExpression");
});
test("parses negated parenthesized expressions", () => {
  const tokens = new Lexer("-(1 + 2)").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "UnaryExpression");
  if (statement.expression.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Minus);
  assert.equal(statement.expression.operand.type, "BinaryExpression");
});
test("rejects repeated negation without parentheses", () => {
  const tokens = new Lexer("--5").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Repeated negation requires parentheses/,
  );
});
test("allows repeated negation through parentheses", () => {
  const tokens = new Lexer("-(-5)").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "UnaryExpression");
  if (statement.expression.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.operand.type, "UnaryExpression");
});
test("rejects an integer literal outside the supported range", () => {
  const tokens = new Lexer("9_007_199_254_740_992").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Integer literal is outside the supported range/,
  );
});
test("rejects a missing right operand", () => {
  const tokens = new Lexer("1 +").lex();
  assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
});
test("rejects a missing left operand", () => {
  const tokens = new Lexer("* 2").lex();
  assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
});
test("rejects adjacent binary operators", () => {
  const tokens = new Lexer("1 + * 2").lex();
  assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
});
test("rejects a missing closing parenthesis", () => {
  const tokens = new Lexer("(1 + 2").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Expected '\)' after expression/,
  );
});
test("rejects an unexpected closing parenthesis", () => {
  const tokens = new Lexer("1 + 2)").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Expected a newline after statement/,
  );
});
test("rejects empty parentheses", () => {
  const tokens = new Lexer("()").lex();
  assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
});
test("parses true as a Boolean literal", () => {
  const tokens = new Lexer("true").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BooleanLiteral",
      value: true,
    },
  });
});
test("parses false as a Boolean literal", () => {
  const tokens = new Lexer("false").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BooleanLiteral",
      value: false,
    },
  });
});
test("parses equality comparisons", () => {
  const tokens = new Lexer("1 == 2").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BinaryExpression",
      left: {
        type: "IntegerLiteral",
        value: 1,
      },
      operator: {
        type: TokenType.EqualEqual,
        lexeme: "==",
        line: 1,
        column: 3,
      },
      right: {
        type: "IntegerLiteral",
        value: 2,
      },
    },
  });
});
test("parses inequality comparisons", () => {
  const tokens = new Lexer("true != false").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "BinaryExpression",
      left: {
        type: "BooleanLiteral",
        value: true,
      },
      operator: {
        type: TokenType.BangEqual,
        lexeme: "!=",
        line: 1,
        column: 6,
      },
      right: {
        type: "BooleanLiteral",
        value: false,
      },
    },
  });
});
test("parses ordering comparisons", () => {
  const cases: Array<[string, TokenType]> = [
    ["1 < 2", TokenType.Less],
    ["1 <= 2", TokenType.LessEqual],
    ["1 > 2", TokenType.Greater],
    ["1 >= 2", TokenType.GreaterEqual],
  ];
  for (const [source, expectedOperator] of cases) {
    const tokens = new Lexer(source).lex();
    const program = new Parser(tokens).parse();
    const statement = program.statements[0];
    assert.equal(statement?.type, "ExpressionStatement");
    if (statement?.type !== "ExpressionStatement") {
      assert.fail("Expected an expression statement.");
    }
    assert.equal(statement.expression.type, "BinaryExpression");
    if (statement.expression.type !== "BinaryExpression") {
      assert.fail("Expected a binary expression.");
    }
    assert.equal(statement.expression.operator.type, expectedOperator);
  }
});
test("parses arithmetic before comparison operators", () => {
  const tokens = new Lexer("1 + 2 * 3 == 7").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.EqualEqual);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Plus);
  assert.equal(statement.expression.left.right.type, "BinaryExpression");
  if (statement.expression.left.right.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.right.operator.type, TokenType.Star);
});
test("allows parenthesized comparison expressions", () => {
  const tokens = new Lexer("(1 < 2) == true").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.EqualEqual);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Less);
  assert.deepEqual(statement.expression.right, {
    type: "BooleanLiteral",
    value: true,
  });
});
test("rejects mixed unparenthesized comparison chains", () => {
  const cases = ["1 < 2 == true", "1 != 2 >= 3"];
  for (const source of cases) {
    const tokens = new Lexer(source).lex();
    assert.throws(
      () => new Parser(tokens).parse(),
      /Equality and ordering operators cannot be mixed in one comparison chain/,
    );
  }
});
test("reports the mixed comparison operator position", () => {
  const tokens = new Lexer("1 < 2 == true").lex();
  assert.throws(
    () => new Parser(tokens).parse(),
    /Equality and ordering operators cannot be mixed in one comparison chain\. at 1:7/,
  );
});
test("parses not as a unary expression", () => {
  const tokens = new Lexer("not true").lex();
  const program = new Parser(tokens).parse();
  assert.deepEqual(program.statements[0], {
    type: "ExpressionStatement",
    expression: {
      type: "UnaryExpression",
      operator: {
        type: TokenType.Not,
        lexeme: "not",
        line: 1,
        column: 1,
      },
      operand: {
        type: "BooleanLiteral",
        value: true,
      },
    },
  });
});
test("parses repeated not operators", () => {
  const tokens = new Lexer("not not true").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "UnaryExpression");
  if (statement.expression.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Not);
  assert.equal(statement.expression.operand.type, "UnaryExpression");
  if (statement.expression.operand.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.operand.operator.type, TokenType.Not);
});
test("parses and left-associatively", () => {
  const tokens = new Lexer("true and false and true").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.And);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.And);
});
test("parses or left-associatively", () => {
  const tokens = new Lexer("true or false or true").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Or);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Or);
});
test("parses comparisons before not", () => {
  const tokens = new Lexer("not 1 < 2").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "UnaryExpression");
  if (statement.expression.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Not);
  assert.equal(statement.expression.operand.type, "BinaryExpression");
  if (statement.expression.operand.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operand.operator.type, TokenType.Less);
});
test("parses not before and", () => {
  const tokens = new Lexer("not true and false").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.And);
  assert.equal(statement.expression.left.type, "UnaryExpression");
  if (statement.expression.left.type !== "UnaryExpression") {
    assert.fail("Expected a unary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Not);
});
test("parses and before or", () => {
  const tokens = new Lexer("true or false and false").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.Or);
  assert.equal(statement.expression.right.type, "BinaryExpression");
  if (statement.expression.right.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.right.operator.type, TokenType.And);
});
test("allows parentheses to override logical precedence", () => {
  const tokens = new Lexer("(true or false) and false").lex();
  const program = new Parser(tokens).parse();
  const statement = program.statements[0];
  assert.equal(statement?.type, "ExpressionStatement");
  if (statement?.type !== "ExpressionStatement") {
    assert.fail("Expected an expression statement.");
  }
  assert.equal(statement.expression.type, "BinaryExpression");
  if (statement.expression.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.operator.type, TokenType.And);
  assert.equal(statement.expression.left.type, "BinaryExpression");
  if (statement.expression.left.type !== "BinaryExpression") {
    assert.fail("Expected a binary expression.");
  }
  assert.equal(statement.expression.left.operator.type, TokenType.Or);
});
test("rejects missing logical operands", () => {
  const cases = ["true and", "false or", "not"];
  for (const source of cases) {
    const tokens = new Lexer(source).lex();
    assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
  }
});
test("rejects logical keywords as assignment identifiers", () => {
  const cases = ["and = true", "or = false", "not = true"];
  for (const source of cases) {
    const tokens = new Lexer(source).lex();
    assert.throws(() => new Parser(tokens).parse(), /Expected expression/);
  }
});
