export enum TokenType {
    Integer,

    Identifier,

    Assign,

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