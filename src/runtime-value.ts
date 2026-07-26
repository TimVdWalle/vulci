// Phase 7

export type RuntimeValue =
  IntegerValue | BooleanValue | NullValue | NativeFunctionValue;

export interface IntegerValue {
  type: "Integer";
  value: number;
}

export interface BooleanValue {
  type: "Boolean";
  value: boolean;
}

export interface NullValue {
  type: "Null";
}

export interface NativeFunctionValue {
  type: "NativeFunction";
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
