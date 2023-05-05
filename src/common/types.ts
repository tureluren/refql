import { Raw, Value, Values, Values2D, When } from "../nodes";
import RefField from "../RefField";
import Table from "../Table";

// Array, Function, Date, ...
export type StringMap = Record<string, any>;

export type ValueType =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | StringMap;

export type Querier =
  <T>(query: string, values: ValueType[]) => Promise<T[]>;

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface RefInfo {
  parent: Table;
  as: string;
  lRef: RefField;
  rRef: RefField;
  xTable?: Table;
  lxRef?: RefField;
  rxRef?: RefField;
}

export interface RefInput {
  as?: string;
  lRef?: string;
  rRef?: string;
  xTable?: string;
  lxRef?: string;
  rxRef?: string;
}

export interface RefQLRows {
  refQLRows: any[];
}

export type TagFunctionVariable<Params, Output = ValueType> =
  (params: Params) => Output;

export type SQLNode<Params> =
  | Raw<Params>
  | Value<Params>
  | Values<Params>
  | Values2D<Params>
  | When<Params>;

export type SQLTagVariable<Params> =
  | SQLNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;