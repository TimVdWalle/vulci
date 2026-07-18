export interface Program {
    type: "Program";
    statements: Statement[];
}

export type Statement =
    | VariableAssignment
    | ExpressionStatement;

export interface VariableAssignment {
    type: "VariableAssignment";
    name: string;
    value: Expression;
}

export interface ExpressionStatement {
    type: "ExpressionStatement";
    expression: Expression;
}

export type Expression =
    | IntegerLiteral
    | VariableReference
    | FunctionCall;

export interface IntegerLiteral {
    type: "IntegerLiteral";
    value: number;
}

export interface VariableReference {
    type: "VariableReference";
    name: string;
}

export interface FunctionCall {
    type: "FunctionCall";
    callee: string;
    arguments: Expression[];
}