// Phase 7

import { Token } from "./token.js";

export interface Program {
  type: "Program";
  statements: Statement[];
}

export type Statement = ExpressionStatement;

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: Expression;
}

export type Expression =
  | IntegerLiteral
  | BooleanLiteral
  | NullLiteral
  | VariableReference
  | AssignmentExpression
  | FunctionDeclaration
  | FunctionCall
  | ReturnExpression
  | UnaryExpression
  | BinaryExpression
  | ComparisonChainExpression
  | ConditionalExpression;

export interface IntegerLiteral {
  type: "IntegerLiteral";
  value: number;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
}

export interface NullLiteral {
  type: "NullLiteral";
}

export interface VariableReference {
  type: "VariableReference";
  name: string;
}

export interface AssignmentExpression {
  type: "AssignmentExpression";
  name: string;
  value: Expression;
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  keyword: Token;
  name: Token;
  parameters: Token[];
  expressions: Expression[];
}

export interface FunctionCall {
  type: "FunctionCall";
  callee: string;
  calleeToken: Token;
  arguments: Expression[];
}

export interface ReturnExpression {
  type: "ReturnExpression";
  keyword: Token;
  value: Expression | null;
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

export interface ComparisonChainExpression {
  type: "ComparisonChainExpression";
  operands: Expression[];
  operators: Token[];
}

export interface ConditionalBranch {
  keyword: Token;
  condition: Expression;
  expressions: Expression[];
}

export interface ConditionalExpression {
  type: "ConditionalExpression";
  branches: ConditionalBranch[];
  elseKeyword: Token | null;
  elseExpressions: Expression[] | null;
}
