// Phase 7

export enum TokenType {
  Integer,
  Identifier,
  True,
  False,
  Null,
  If,
  Else,
  Fn,
  Return,
  And,
  Or,
  Not,
  Assign,
  EqualEqual,
  BangEqual,
  Less,
  LessEqual,
  Greater,
  GreaterEqual,
  Plus,
  Minus,
  Star,
  Slash,
  Percent,
  LeftParen,
  RightParen,
  LeftBrace,
  RightBrace,
  Comma,
  Newline,
  EOF,
}

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}
