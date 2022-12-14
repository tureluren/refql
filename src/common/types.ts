import { ASTNode, BelongsTo, BelongsToMany, HasMany, HasOne, Value } from "../nodes";
import Raw from "../Raw";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";
import Values from "../Values";
import Values2D from "../Values2D";

type NotFunction<T> = T extends Function ? never : T;


const id = (x: any) => x;

export type StringMap = { [k: string]: any };

export type Querier = <T>(query: string, values: any[]) =>
  Promise<T[]>;

export type BuiltIn =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string;
  // | StringMap;

const bi: NotFunction<typeof id> = "1";

export type ParamF<Params, Return> = (p: Params, T?: Table) =>
  Return;

export type RefQLValue<Params, Output, Ran extends boolean = false> =
  Ran extends false
  ? BuiltIn | SQLTag<Params, Output> | ParamF<Params, BuiltIn | SQLTag<Params, Output>>
  : BuiltIn | SQLTag<Params, Output>;

export interface Ref {
  name: string; as: string;
}

export interface Refs {
  lRef?: Ref; rRef?: Ref;
  lxRef?: Ref; rxRef?: Ref;
}

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface RefInfo {
  as: string;
  lRef: Ref;
  rRef: Ref;
}

export interface BelongsToInfo extends RefInfo {}

export interface BelongsToManyInfo extends RefInfo {
  xTable: Table;
  lxRef: Ref;
  rxRef: Ref;
}

export interface HasManyInfo extends RefInfo {}

export interface HasOneInfo extends RefInfo {}

export type TableRefMakerPair =
  [
    Table,
    (parent: Table, tag: RQLTag<unknown, unknown>, as?: string) =>
      BelongsTo<unknown> | BelongsToMany<unknown> | HasMany<unknown> | HasOne<unknown>
  ];

export type TagFunctionVariable<Params, InRQL extends boolean = false, Return = any> =
  InRQL extends false
  ? (params: Params, table?: Table) => Return
  : (params: Params, table: Table) => Return;

export type SQLTagVariable<Params, Output, InRQL extends boolean = false> =
  | SQLTag<Params, Output, InRQL>
  | Value<Params, InRQL>
  | Values<Params, InRQL>
  | Values2D<Params, InRQL>
  | Raw<Params, InRQL>
  | TagFunctionVariable<Params, InRQL>
  | BuiltIn;

export type RQLTagVariable<Params, Output> =
  | RQLTag<Params, Output>
  | SQLTag<Params, Output, true>
  | Raw<Params, true>
  | TagFunctionVariable<Params, true>
  | Array<ASTNode<Params>>;