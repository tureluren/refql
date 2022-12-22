import { ASTNode, Raw, Ref, Value, Values, Values2D } from "../nodes";
import RefNode from "../nodes/RefNode";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";

export type NotAFunction =
  | { caller?: never }
  | { bind?: never }
  | { apply?: never }
  | { call?: never };

export type StringMap = { [k: string]: any } & NotAFunction;

export type ValueType =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | StringMap;

export type Querier = <T>(query: string, values: ValueType[]) =>
  Promise<T[]>;

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface RefInfo {
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

export type TagFunctionVariable<Params, InRQL extends boolean = true, Return = ValueType> =
  InRQL extends false
  ? (params: Params, table?: Table) => Return
  : (params: Params, table: Table) => Return;

export type SQLTagVariable<Params, InRQL extends boolean = true> =
  | SQLTag<Params, InRQL>
  | TagFunctionVariable<Params, InRQL>
  | ASTNode<Params, InRQL>
  | ValueType;

export type RQLTagVariable<Params> =
  | RQLTag<Params>
  | SQLTag<Params>
  | Table
  | ASTNode<Params>
  | ASTNode<Params>[]
  | Raw<Params, true>
  | TagFunctionVariable<Params>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMakerPair = [
  Table,
  (parent: Table, tag: RQLTag<unknown>, as?: string) => RefNode<unknown>
];