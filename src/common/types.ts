import { ASTNode, BelongsTo, BelongsToMany, HasMany, HasOne, Value } from "../nodes";
import Raw from "../Raw";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";
import Values from "../Values";

export interface StringMap {
  [key: string]: any;
}

export type Querier = <T>(query: string, values: any[]) =>
  Promise<T[]>;

export type BuiltIn =
  | boolean | null
  | undefined | number
  | bigint | string;

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
  lRefs: Ref[]; rRefs: Ref[];
  lxRefs: Ref[]; rxRefs: Ref[];
}

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface RefInfo {
  as: string;
  lRef: string;
  rRef: string;
}

export interface BelongsToInfo extends RefInfo {}

export interface BelongsToManyInfo extends RefInfo {
  xTable: Table;
  lxRef: string;
  rxRef: string;
}

export interface HasManyInfo extends RefInfo {}

export interface HasOneInfo extends RefInfo {}

export type TableRefMakerPair =
  [
    Table,
    (parent: Table, tag: RQLTag<unknown, unknown>, as?: string) =>
      BelongsTo<unknown> | BelongsToMany<unknown> | HasMany<unknown> | HasOne<unknown>
  ];

export type TagFunctionVariable<Params> = (params: Params, table?: Table) => any;

export type SQLTagVariable<Params, Output> =
  | SQLTag<Params, Output>
  | Values<Params>
  | Value<Params>
  | Raw<Params>
  | TagFunctionVariable<Params>
  | Array<BuiltIn>
  | BuiltIn;