// Phase 13

export type RuntimeValue =
  | IntegerValue
  | StringValue
  | BooleanValue
  | NullValue
  | TupleValue
  | AnonymousObjectValue
  | StructValue
  | NativeFunctionValue;

export interface IntegerValue {
  type: "Integer";
  value: number;
}

export interface StringValue {
  type: "String";
  value: string;
}

export interface BooleanValue {
  type: "Boolean";
  value: boolean;
}

export interface NullValue {
  type: "Null";
}

export interface TupleValue {
  type: "Tuple";
  members: RuntimeValue[];
}

export interface AnonymousObjectFieldValue {
  name: string;
  value: RuntimeValue;
}

export interface AnonymousObjectValue {
  type: "AnonymousObject";
  fields: AnonymousObjectFieldValue[];
}

export interface StructFieldValue {
  name: string;
  value: RuntimeValue;
}

export interface StructValue {
  type: "Struct";
  name: string;
  fields: StructFieldValue[];
}

export interface NativeFunctionParameter {
  name: string;
  required: boolean;
}

export interface NativeFunctionValue {
  type: "NativeFunction";
  parameters: NativeFunctionParameter[];
  call(arguments_: RuntimeValue[]): RuntimeValue;
}

export const TRUE_VALUE: BooleanValue = {
  type: "Boolean",
  value: true,
};

export const FALSE_VALUE: BooleanValue = {
  type: "Boolean",
  value: false,
};

export const NULL_VALUE: NullValue = {
  type: "Null",
};
