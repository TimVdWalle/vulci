// Phase 9

import { Program } from "./ast.js";
import { Environment } from "./environment.js";
import { NULL_VALUE, RuntimeValue } from "./runtime-value.js";
import { ExpressionEvaluator } from "./evaluator/expression-evaluator.js";

export class Evaluator extends ExpressionEvaluator {
  constructor(environment: Environment) {
    super(environment);
  }

  public evaluate(program: Program): RuntimeValue {
    this.registerFunctions(program);

    let result: RuntimeValue = NULL_VALUE;

    for (const statement of program.statements) {
      result = this.evaluateStatement(statement);
    }

    return result;
  }
}
