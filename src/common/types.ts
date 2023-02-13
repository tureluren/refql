import { ASTNode } from "../nodes";
import RefNode from "../nodes/RefNode";
import RefField from "../RefField";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";
import { HKT, Kind, URIS } from "./HKT";

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
  (params: Params, table?: Table) => Return;

export type SQLTagVariable<Params, Output> =
  | SQLTag<Params, Output>
  | ASTNode<Params, Output>
  | Table
  | TagFunctionVariable<Params>
  | ValueType;

export type RQLTagVariable<Params, Output> =
  | RQLTag<Params, Output>
  | SQLTag<Params, Output>
  | ASTNode<Params, Output>
  | ASTNode<Params, Output>[]
  | Table
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMaker =
  (parent: Table, tag: RQLTag, as?: string, single?: boolean) => RefNode;

export type ConvertPromise<F extends URIS, A = unknown> = (p: Promise<A>) => Kind<F, A>;

export type Runnable<Params = unknown, Output = unknown> =
  Params extends Record<string, never>
    ? (params?: Params, querier?: Querier) => Output
    : Params extends StringMap
      ? (params: Params, querier?: Querier) => Output
      : (params?: Params, querier?: Querier) => Output;

export type RQLTagMaker<URI extends URIS = "Promise"> =
  <Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output>[]) => RQLTag<Params, Output, URI> & Runnable<Params, ReturnType<ConvertPromise<URI, Output>>>;

export type Ref = [
  Table & RQLTagMaker,
  RefMaker
];