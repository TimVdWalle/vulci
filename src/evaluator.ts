// Phase 13

import { Program } from "./ast.js";
import { Environment } from "./environment.js";
import { ExpressionEvaluator } from "./evaluator/expression-evaluator.js";
import { NULL_VALUE, RuntimeValue } from "./runtime-value.js";

export class Evaluator extends ExpressionEvaluator {
  constructor(environment: Environment) {
    super(environment);
  }

  public evaluate(program: Program): RuntimeValue {
    this.registerDeclarations(program);

    let result: RuntimeValue = NULL_VALUE;

    for (const statement of program.statements) {
      result = this.evaluateStatement(statement);
    }

    return result;
  }
}
