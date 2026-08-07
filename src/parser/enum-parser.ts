// Phase 14

import { EnumDeclaration } from "../ast.js";
import { BUILT_IN_TYPE_NAMES } from "../type-names.js";
import { Token, TokenType } from "../token.js";
import { StructParser } from "./struct-parser.js";

export abstract class EnumParser extends StructParser {
  protected enumDeclaration(keyword: Token): EnumDeclaration {
    if (this.check(TokenType.Null)) {
      const name = this.advance();
      throw this.error(
        name,
        `E_ENUM_DUP: Enum name '${name.lexeme}' conflicts with a built-in type.`,
      );
    }

    const name = this.consume(
      TokenType.Identifier,
      "Expected enum name after 'enum'.",
    );

    if (name.lexeme.startsWith("$")) {
      throw this.error(name, "Enum names cannot be global identifiers.");
    }

    if (name.lexeme === "self") {
      throw this.error(
        name,
        "E_ENUM_DUP: Enum name 'self' conflicts with the implicit self binding.",
      );
    }

    if (BUILT_IN_TYPE_NAMES.has(name.lexeme)) {
      throw this.error(
        name,
        `E_ENUM_DUP: Enum name '${name.lexeme}' conflicts with a built-in type.`,
      );
    }

    this.consume(TokenType.LeftBrace, "Expected '{' after enum name.");
    this.skipNewlines();

    if (this.check(TokenType.RightBrace)) {
      throw this.error(
        this.peek(),
        "Enum declarations require at least one member.",
      );
    }

    const members: Token[] = [];
    const memberNames = new Set<string>();

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const member = this.consume(
        TokenType.Identifier,
        "Expected enum member name.",
      );

      if (member.lexeme.startsWith("$")) {
        throw this.error(
          member,
          "Enum member names cannot be global identifiers.",
        );
      }

      if (memberNames.has(member.lexeme)) {
        throw this.error(
          member,
          `E_ENUM_MEMBER_DUP: Duplicate enum member '${member.lexeme}'.`,
        );
      }

      memberNames.add(member.lexeme);
      members.push(member);

      if (this.check(TokenType.RightBrace)) break;

      this.consume(TokenType.Newline, "Expected a newline after enum member.");
      this.skipNewlines();
    }

    this.consume(TokenType.RightBrace, "Expected '}' after enum body.");

    return { type: "EnumDeclaration", keyword, name, members };
  }
}
