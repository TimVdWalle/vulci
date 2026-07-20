import { Token } from "./token.js";

export interface Program {
  type: "Program";
  statements: Statement[];
}

export type Statement = VariableAssignment | ExpressionStatement;

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
  | BooleanLiteral
  | VariableReference
  | FunctionCall
  | UnaryExpression
  | BinaryExpression;

export interface IntegerLiteral {
  type: "IntegerLiteral";
  value: number;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
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

export interface UnaryExpression {
  type: "UnaryExpression";
  operator: Token;
  operand: Expression;
}

export interface BinaryExpression {
  type: "BinaryExpression";
  left: Expression;
  operator: Token;
  right: Expression;
}
