export type RuntimeValue = IntegerValue | NullValue | NativeFunctionValue;

export interface IntegerValue {
  type: "Integer";
  value: number;
}

export interface NullValue {
  type: "Null";
}

export interface NativeFunctionValue {
  type: "NativeFunction";
  call(arguments_: RuntimeValue[]): RuntimeValue;
}

export const NULL_VALUE: NullValue = {
  type: "Null",
};
