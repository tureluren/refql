import SQLTag from "../SQLTag";
import Table from "../Table";

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
  lRefs: Ref[]; rRefs: Ref[];
  lxRefs: Ref[]; rxRefs: Ref[];
}

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface BelongsToInfo {
  as: string;
  lRef: string;
  rRef: string;
}

export interface BelongsToManyInfo {
  as: string;
  lRef: string;
  rRef: string;
  lxRef: string;
  rxRef: string;
  xTable: Table;
}

export interface HasManyInfo {
  as: string;
  lRef: string;
  rRef: string;
}

export interface HasOneInfo {
  as: string;
  lRef: string;
  rRef: string;
}