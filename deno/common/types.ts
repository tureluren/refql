import SQLTag from "../SQLTag/index.ts";
import Table from "../Table/index.ts";

export interface StringMap {
  [key: string]: any;
}

export type Querier<T> = (query: string, values: any[]) =>
  Promise<T[]>;

export type BuiltIn =
  | boolean | null
  | undefined | number
  | bigint | string
  | object;

export type ParamF<Params, Return> = (p: Params, T?: Table) =>
  Return;

export type RefQLValue<Params, Ran extends boolean = false> =
  Ran extends false
  ? BuiltIn | SQLTag<Params> | ParamF<Params, BuiltIn | SQLTag<Params>>
  : BuiltIn | SQLTag<Params>;

export interface Ref {
  name: string; as: string;
}

export interface Refs {
  lrefs: Ref[]; rrefs: Ref[];
  lxrefs: Ref[]; rxrefs: Ref[];
}

export interface CastAs {
  as?: string;
  cast?: string;
}