import { ASTNode } from "../nodes";
import RefNode from "../nodes/RefNode";
import RefField from "../RefField";
import { RQLTag } from "../RQLTag";
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

export type TagFunctionVariable<Params, Return = ValueType> =
  (params: Params) => Return;

export type SQLTagVariable<Params, Output> =
  // | SQLTag<Params, Output>
  | ASTNode<Params, Output>
  // | Table
  | TagFunctionVariable<Params>
  | ValueType;

export type RQLTagVariable<Params, Output> =
  // | RQLTag<Params, Output>
  | SQLTag<Params, Output>
  | ASTNode<Params, Output>
  | ASTNode<Params, Output>[]
  // | Table
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMaker =
  <Params, Output>(parent: Table, tag: RQLTag<any, Params, Output>, as?: string, single?: boolean) => RefNode<Params, Output>;

export type Runnable<Params, Output> =
  Params extends Record<string, never>
    ? (params?: Params, querier?: Querier) => Output
    : Params extends StringMap
      ? (params: Params, querier?: Querier) => Output
      : (params?: Params, querier?: Querier) => Output;


export type Ref = [
  Table,
  RefMaker
];