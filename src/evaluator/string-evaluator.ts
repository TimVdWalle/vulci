// Phase 10

import { MemberCall, StringLiteral } from "../ast.js";
import {
  FALSE_VALUE,
  IntegerValue,
  RuntimeValue,
  StringValue,
  TRUE_VALUE,
} from "../runtime-value.js";
import { ScopeResolver } from "./scope-resolver.js";

export abstract class StringEvaluator extends ScopeResolver {
  protected evaluateStringLiteral(expression: StringLiteral): StringValue {
    let value = "";

    for (const segment of expression.segments) {
      if (segment.type === "Text") {
        value += segment.value;
        continue;
      }

      const result = this.evaluateExpression(segment.expression);

      switch (result.type) {
        case "String":
          value += result.value;
          break;

        case "Integer":
          value += result.value.toString();
          break;

        case "Boolean":
          value += result.value ? "true" : "false";
          break;

        default:
          throw new Error(
            "E_IPL_TYPE: Interpolation result must be str, int, or bool. " +
              `at ${segment.token.line}:${segment.token.column}`,
          );
      }
    }

    return { type: "String", value };
  }

  protected evaluateMemberCall(expression: MemberCall): RuntimeValue {
    const receiver = this.evaluateExpression(expression.receiver);

    if (receiver.type !== "String") {
      throw new Error(
        `E_MEM_TYPE: Type '${this.runtimeTypeName(receiver)}' does not support ` +
          `member '${expression.member.lexeme}'. at ` +
          `${expression.member.line}:${expression.member.column}`,
      );
    }

    const arguments_ = expression.arguments.map((argument) =>
      this.evaluateExpression(argument),
    );

    switch (expression.member.lexeme) {
      case "contains":
        this.requireMemberArgumentCount(expression, arguments_, 1);

        if (arguments_[0]?.type !== "String") {
          throw new Error(
            "E_ARG_TYPE: Member 'contains' expects a str argument. at " +
              `${expression.member.line}:${expression.member.column}`,
          );
        }

        return receiver.value.includes(arguments_[0].value)
          ? TRUE_VALUE
          : FALSE_VALUE;

      case "count": {
        this.requireMemberArgumentCount(expression, arguments_, 0);
        const segmenter = new Intl.Segmenter(undefined, {
          granularity: "grapheme",
        });
        const count = Array.from(segmenter.segment(receiver.value)).length;
        const result: IntegerValue = { type: "Integer", value: count };

        return result;
      }

      default:
        throw new Error(
          `E_MEM_UNKNOWN: Unknown string member '${expression.member.lexeme}'. ` +
            `at ${expression.member.line}:${expression.member.column}`,
        );
    }
  }

  private requireMemberArgumentCount(
    expression: MemberCall,
    arguments_: RuntimeValue[],
    expected: number,
  ): void {
    if (arguments_.length === expected) {
      return;
    }

    throw new Error(
      `E_ARG_COUNT: Member '${expression.member.lexeme}' expects ${expected} ` +
        `argument${expected === 1 ? "" : "s"}, but received ${arguments_.length}. ` +
        `at ${expression.member.line}:${expression.member.column}`,
    );
  }
}
