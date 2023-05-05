import { ASTNode } from "../nodes";
import RefField from "../RefField";
import { SQLTag } from "../SQLTag";
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

export type TagFunctionVariable<Params> =
  (params: Params) => any;

export type SQLTagVariable<Params, Output> =
  | ASTNode<Params, Output>
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}