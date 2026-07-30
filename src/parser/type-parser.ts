// Phase 11

import { BuiltInTypeName, TypeAnnotation, TypeMember } from "../ast.js";
import { Token, TokenType } from "../token.js";
import { ParserContext } from "./parser-context.js";

export abstract class TypeParser extends ParserContext {
  protected finishTypeAnnotation(first: Token): TypeAnnotation {
    const members: TypeMember[] = [this.finishTypeMember(first)];
    const memberNames = new Set<string>([this.typeMemberName(members[0]!) ]);

    while (this.match(TokenType.Pipe)) {
      if (this.check(TokenType.Pipe)) {
        throw this.error(this.peek(), "A union type cannot contain repeated '|'.");
      }

      const token = this.consumeTypeName("Expected a type name after '|'.");
      const member = this.finishTypeMember(token);
      const name = this.typeMemberName(member);

      if (memberNames.has(name)) {
        throw this.error(token, `Duplicate union member '${name}'.`);
      }

      memberNames.add(name);
      members.push(member);
    }

    if (members.length > 1 && memberNames.has("any")) {
      const anyMember = members.find((member) => member.lexeme === "any")!;
      throw this.error(anyMember.token, "'any' cannot appear inside a union type.");
    }

    return { members };
  }

  private finishTypeMember(token: Token): TypeMember {
    if (token.lexeme === "tuple") {
      return this.finishTupleType(token);
    }

    this.validateTypeName(token);
    return { type: "NamedType", lexeme: token.lexeme, token };
  }

  private finishTupleType(token: Token): TypeMember {
    if (!this.match(TokenType.LeftParen)) {
      throw this.error(token, "A bare 'tuple' type does not exist.");
    }

    const members: TypeAnnotation[] = [];
    this.skipNewlines();

    if (this.check(TokenType.RightParen)) {
      throw this.error(this.peek(), "Tuple types require at least two member types.");
    }

    while (true) {
      if (this.check(TokenType.Comma)) {
        throw this.error(this.peek(), "Expected a tuple member type before ','.");
      }

      const first = this.consumeTypeName("Expected a tuple member type.");
      members.push(this.finishTypeAnnotation(first));
      this.skipNewlines();

      if (!this.match(TokenType.Comma)) break;
      this.skipNewlines();
      if (this.check(TokenType.RightParen)) break;
    }

    this.consume(TokenType.RightParen, "Expected ')' after tuple type.");

    if (members.length < 2) {
      throw this.error(token, "Tuple types require at least two member types.");
    }

    return { type: "TupleType", lexeme: "tuple", token, members };
  }

  private typeMemberName(member: TypeMember): string {
    if (member.type === "NamedType") return member.lexeme;
    return `tuple(${member.members.map((item) => this.typeAnnotationText(item)).join(", ")})`;
  }

  private typeAnnotationText(annotation: TypeAnnotation): string {
    return annotation.members.map((member) => this.typeMemberName(member)).join("|");
  }

  protected validateTypeName(token: Token): asserts token is Token & { lexeme: BuiltInTypeName } {
    if (!TypeParser.BUILT_IN_TYPE_NAMES.has(token.lexeme)) {
      throw this.error(token, `Unknown type name '${token.lexeme}'.`);
    }
  }

  protected consumeTypeName(message: string): Token {
    if (this.match(TokenType.Identifier, TokenType.Null)) return this.previous();
    throw this.error(this.peek(), message);
  }
}
