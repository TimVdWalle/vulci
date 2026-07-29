// Phase 10

import { BuiltInTypeName, TypeAnnotation } from "../ast.js";
import { Token, TokenType } from "../token.js";
import { ParserContext } from "./parser-context.js";

export abstract class TypeParser extends ParserContext {
  protected finishTypeAnnotation(first: Token): TypeAnnotation {
    this.validateTypeName(first);

    const members: Token[] = [first];
    const memberNames = new Set<string>([first.lexeme]);

    while (this.match(TokenType.Pipe)) {
      if (this.check(TokenType.Pipe)) {
        throw this.error(
          this.peek(),
          "A union type cannot contain repeated '|'.",
        );
      }

      const member = this.consumeTypeName("Expected a type name after '|'.");

      this.validateTypeName(member);

      if (memberNames.has(member.lexeme)) {
        throw this.error(member, `Duplicate union member '${member.lexeme}'.`);
      }

      memberNames.add(member.lexeme);
      members.push(member);
    }

    if (members.length > 1 && memberNames.has("any")) {
      const anyMember = members.find((member) => member.lexeme === "any")!;

      throw this.error(anyMember, "'any' cannot appear inside a union type.");
    }

    return { members };
  }

  protected validateTypeName(token: Token): asserts token is Token & {
    lexeme: BuiltInTypeName;
  } {
    if (!TypeParser.BUILT_IN_TYPE_NAMES.has(token.lexeme)) {
      throw this.error(token, `Unknown type name '${token.lexeme}'.`);
    }
  }

  protected consumeTypeName(message: string): Token {
    if (this.match(TokenType.Identifier, TokenType.Null)) {
      return this.previous();
    }

    throw this.error(this.peek(), message);
  }
}
