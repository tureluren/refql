import { ASTNode, Ref } from "../nodes";
import RefNode from "../nodes/RefNode";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";

// Array, Function, Date, ...
export type StringMap = { [k: string]: any };

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
  lRef: Ref;
  rRef: Ref;
  xTable?: Table;
  lxRef?: Ref;
  rxRef?: Ref;
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
  (params: Params, table?: Table) => Return;

export type SQLTagVariable<Params> =
  | SQLTag<Params>
  | ASTNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;

export type RQLTagVariable<Params> =
  | RQLTag<Params>
  | SQLTag<Params>
  | ASTNode<Params>
  | ASTNode<Params>[]
  | Table
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMakerPair = [
  Table,
  (parent: Table, tag: RQLTag<unknown>, as?: string) => RefNode<unknown>
];