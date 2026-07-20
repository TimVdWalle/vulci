export enum TokenType {
    Integer,
    Identifier,

    Assign,
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