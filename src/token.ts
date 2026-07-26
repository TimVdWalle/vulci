// Phase 8

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
  Returns,
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
  Pipe,
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
  whitespaceBefore?: boolean;
  whitespaceAfter?: boolean;
}
