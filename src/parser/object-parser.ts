// Phase 14

import { AnonymousObjectLiteral } from "../ast.js";
import { Token, TokenType } from "../token.js";
import { EnumParser } from "./enum-parser.js";

export abstract class ObjectParser extends EnumParser {
  protected finishAnonymousObject(keyword: Token): AnonymousObjectLiteral {
    const fields: AnonymousObjectLiteral["fields"] = [];
    const names = new Set<string>();

    this.skipNewlines();

    if (this.check(TokenType.RightParen)) {
      throw this.error(
        keyword,
        "E_OBJ_EMPTY: Anonymous objects require at least one field.",
      );
    }

    while (!this.check(TokenType.RightParen)) {
      if (this.check(TokenType.Comma)) {
        throw this.error(this.peek(), "Expected object field before ','.");
      }

      const name = this.consume(
        TokenType.Identifier,
        "Expected object field name.",
      );

      if (names.has(name.lexeme)) {
        throw this.error(
          name,
          `E_OBJ_DUP: Duplicate object field '${name.lexeme}'.`,
        );
      }

      names.add(name.lexeme);
      this.consume(TokenType.Colon, "Expected ':' after object field name.");
      this.skipNewlines();

      fields.push({ name, value: this.expression() });
      this.skipNewlines();

      if (!this.match(TokenType.Comma)) break;
      this.skipNewlines();
      if (this.check(TokenType.RightParen)) break;
    }

    this.consume(TokenType.RightParen, "Expected ')' after anonymous object.");
    return { type: "AnonymousObjectLiteral", keyword, fields };
  }
}
