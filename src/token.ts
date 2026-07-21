export enum TokenType {
  Integer,
  Identifier,
  True,
  False,
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
