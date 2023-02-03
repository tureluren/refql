import { ASTNode, Value } from "../nodes";
import RefNode from "../nodes/RefNode";
import Ref from "../Ref";
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

export type SQLTagVariable<Params, Output> =
  | SQLTag<Params, Output>
  | ASTNode
  | Table
  | TagFunctionVariable<Params>
  | ValueType;

export type RQLTagVariable<Params, Output> =
  | RQLTag<Params, Output>
  | SQLTag<Params, Output>
  | ASTNode
  | ASTNode[]
  | Table
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMaker =
  (parent: Table, tag: RQLTag, as?: string, single?: boolean) => RefNode;


export type RQLTagMaker =
  <Params, Output>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output>[]) => RQLTag<Params, Output> & Runnable<Params, Output>;

export type RefMakerPair = [
  Table & RQLTagMaker,
  RefMaker
];

export type Runnable<Params = unknown, Output = unknown> =
  (params?: Params, querier?: Querier) => Promise<Output>;
