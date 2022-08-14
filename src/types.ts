import Environment from "./Environment2";
import { All, BelongsTo, BooleanLiteral, Call, HasMany, Identifier, ManyToMany, NullLiteral, NumericLiteral, Root, StringLiteral, Variable } from "./Parser/Node";
import Raw from "./Raw";
import SqlTag from "./SqlTag";
import Table from "./Table";

export type CaseType = "camel" | "snake";
export type OptCaseType = CaseType | undefined;

export interface Dict {
  [key: string]: any;
}

export type Keys<T> = {
  [K in keyof T]-?: K
}[keyof T][];

export interface RefQLConfig extends Dict {
  // optie om aan te duiden $1 of ? ?
  // 2 opties wss, symbol en enumarate ?
  debug?: (query: string, values: Values, ast?: ASTNode) => void;
  detectRefs: boolean;
  caseType?: CaseType;
  caseTypeJS?: CaseType;
  onSetupError?: (err: Error) => void;
  pluralize: boolean;
  plurals: Plurals;
  refs: RefsOld;
  useSmartAlias: boolean;
  querier: Querier;
}

export type Link = [string, string];
export type TableRefs = { [tableTo: string]: Link[] };
export type RefsOld = { [tableFrom: string]: TableRefs };
export type SQLTag_ = SqlTag<any> | ((t: Table) => SqlTag<any>);

export interface JsonBuildObject<T> {
  json_build_object: T;
}

export type Spec = [RegExp, string | null][];

export type Token = {
  type: string;
  value: string;
};

export type ParamFn<Params, Result> = (p: Params, T: Table) => Result;

export type TableNodeCTor = new (table: Table, members: ASTNode[], keywords: Keywords<any>) => TableNode;

export interface Keywords<Params> {
  as?: string | ParamFn<Params, string>;
  schema?: string | ParamFn<Params, string>;
  name?: string | ParamFn<Params, string>;
  lkey?: string | ParamFn<Params, string>;
  rkey?: string | ParamFn<Params, string>;
  x?: string | ParamFn<Params, string>;
  lxkey?: string | ParamFn<Params, string>;
  rxkey?: string | ParamFn<Params, string>;
  id?: number | string | ParamFn<Params, number | string>;
  limit?: number | ParamFn<Params, number>;
  offset?: number | ParamFn<Params, number>;
}

export type Plurals = {
  [singular: string]: string;
};


export type Literal =
  StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral;

export type TableNode =
  Root | HasMany | BelongsTo | ManyToMany;

export type ASTNode =
  Identifier | All | TableNode | Variable | Call | Literal;

export interface Next {
  exp: ASTNode;
  refs: Refs;
}

export interface EnvRecord<Input> {
  table: Table;
  query: string;
  sqlTag: SqlTag<Input>;
  comps: string[];
  values: Values;
  next: Next[];
  refs: Refs;
  inCall: boolean;
}

export interface CompiledQuery {
  query: string;
  values: Values;
  table: Table;
  next: Next[];
}

// export type TagFn = {
//   (baseTag: RqlTag, ...snippets: any[]): RqlTag;
//   (baseTag: SqlTag, ...snippets: any[]): SqlTag;
//   (baseTag: RqlTag | SqlTag, ...snippets: any[]): RqlTag | SqlTag;
// };

export type TagFn = {
  (baseTag: any, ...snippets: any[]): any;
  (baseTag: SqlTag<any>, ...snippets: any[]): SqlTag<any>;
  (baseTag: any | SqlTag<any>, ...snippets: any[]): any | SqlTag<any>;
};

export interface DBRef {
  tableFrom: string;
  constraint: string;
}

export type Primitive = string | number | boolean;

export type RQLValue<Input> = ParamFn<Input, Primitive | SqlTag<Input> | Raw> | Primitive | SqlTag<Input> | Raw | Table;

export type Values = any[];

export type Querier = (query: string, values: Values) => Promise<any[]>;

export type Rules = [RegExp, string][];

export type Transformations<Input> = {
  [key in keyof Partial<EnvRecord<Input>>]: (value: EnvRecord<Input>[key]) => EnvRecord<Input>[key];
};

export interface Key {
  name: string;
  as: string;
}

export interface Refs {
  lkeys: Key[];
  rkeys: Key[];
  lxkeys: Key[];
  rxkeys: Key[];
}

export type Pattern<Params, Return> = Partial<{
  Root: (table: Table, members: ASTNode[], keywords: Keywords<Params>) => Return;
  HasMany: (table: Table, members: ASTNode[], keywords: Keywords<Params>) => Return;
  BelongsTo: (table: Table, members: ASTNode[], keywords: Keywords<Params>) => Return;
  ManyToMany: (table: Table, members: ASTNode[], keywords: Keywords<Params>) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RQLValue<Params>, as?: string, cast?: string) => Return;
  Call: (name: string, members: ASTNode[], as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
}>;
