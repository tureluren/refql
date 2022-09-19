import { ParamF, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";
import BelongsTo from "./BelongsTo";
import HasMany from "./HasMany";
import ManyToMany from "./ManyToMany";
import Root from "./Root";

export interface Keywords<Params, Ran extends boolean = false> extends StringMap {
  xtable?: Ran extends false ? string | ParamF<Params, string> : string;
  lref?: Ran extends false ? string | ParamF<Params, string> : string;
  rref?: Ran extends false ? string | ParamF<Params, string> : string;
  lxref?: Ran extends false ? string | ParamF<Params, string> : string;
  rxref?: Ran extends false ? string | ParamF<Params, string> : string;
  id?: Ran extends false ? number | string | ParamF<Params, number | string> : number | string;
  limit?: Ran extends false ? number | ParamF<Params, number> : number;
  offset?: Ran extends false ? number | ParamF<Params, number> : number;
}

const runKeywords = (params: unknown, table: Table, keywords: Keywords<unknown>) =>
  (Object.keys (keywords) as (keyof typeof keywords)[]).reduce ((acc, key) => {
    const kw = keywords[key];
    acc[key] = typeof kw === "function" ? kw (params, table) : kw;
    return acc;
  }, {} as Keywords<unknown>);

interface TableNode<Params> extends ASTNode<Params> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params>;
  addMember<Params2>(node: ASTNode<Params>): TableNode<Params & Params2>;
  toRoot(): Root<Params>;
  toHasMany(): HasMany<Params>;
  toBelongsTo(): BelongsTo<Params>;
  toManyToMany(): ManyToMany<Params>;
}

export const tableNodePrototype = Object.assign ({}, astNodePrototype, {
  addMember, cata,
  toRoot, toHasMany,
  toBelongsTo, toManyToMany
});

function addMember(this: TableNode<unknown>, node: ASTNode<unknown>) {
  return this.constructor (
    this.table,
    this.members.concat (node),
    this.keywords
  );
}

function cata(this: TableNode<unknown>, pattern: StringMap, params: unknown) {
  return pattern[this.constructor.name] (
    this.table,
    this.members,
    runKeywords (params, this.table, this.keywords)
  );
}

function toRoot(this: TableNode<unknown>) {
  return Root (this.table, this.members, this.keywords);
}

function toHasMany(this: TableNode<unknown>) {
  return HasMany (this.table, this.members, this.keywords);
}

function toBelongsTo(this: TableNode<unknown>) {
  return BelongsTo (this.table, this.members, this.keywords);
}

function toManyToMany(this: TableNode<unknown>) {
  return ManyToMany (this.table, this.members, this.keywords);
}

export default TableNode;