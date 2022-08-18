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
  debug?: (query: string, values: Values, ast?: AstNode<any>) => void;
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

export interface Keywords<Params, Ran extends boolean = false> {
  xtable?: Ran extends false ? string | ParamFn<Params, string> : string;
  lkey?: Ran extends false ? string | ParamFn<Params, string> : string;
  rkey?: Ran extends false ? string | ParamFn<Params, string> : string;
  lxkey?: Ran extends false ? string | ParamFn<Params, string> : string;
  rxkey?: Ran extends false ? string | ParamFn<Params, string> : string;
  id?: Ran extends false ? number | string | ParamFn<Params, number | string> : number | string;
  limit?: Ran extends false ? number | ParamFn<Params, number> : number;
  offset?: Ran extends false ? number | ParamFn<Params, number> : number;
}

export type Plurals = {
  [singular: string]: string;
};

export type Literal <Params, Ran extends boolean = false> =
  StringLiteral<Params, Ran> |
  NumericLiteral<Params, Ran> |
  BooleanLiteral<Params, Ran> |
  NullLiteral<Params, Ran>;

export type KeywordsNode <Params, Ran extends boolean = false> =
  Root<Params, Ran>
  | ManyToMany<Params, Ran> | HasMany<Params, Ran> | BelongsTo<Params, Ran>;

export type MembersNode <Params, Ran extends boolean = false> =
  KeywordsNode<Params, Ran> | Call<Params, Ran>;

export type AstNode <Params, Ran extends boolean = false> =
  Identifier<Params, Ran> | All<Params, Ran> | MembersNode<Params, Ran> | Variable <Params, Ran> | Literal<Params, Ran>;

export interface Next<Input> {
  exp: AstNode <Input, true>;
  refs: Refs;
}

export interface EnvRecord<Input> {
  table: Table;
  query: string;
  sqlTag: SqlTag<Input>;
  comps: string[];
  values: Values;
  next: Next<Input>[];
  refs: Refs;
  inCall: boolean;
}

export interface CompiledQuery<Input > {
  query: string;
  values: Values;
  table: Table;
  next: Next<Input>[];
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

export type RQLValue<Input, Ran extends boolean = false> =
  Ran extends false
  ? Primitive | SqlTag<Input> | Raw | Table | ParamFn<Input, Primitive | SqlTag<Input> | Raw | Table>
  : Primitive | SqlTag<Input> | Raw | Table;


export type Values = any[];

export type Querier = (query: string, values: Values) => Promise<any[]>;

export type Rules = [RegExp, string][];

export type Transformations<Input > = {
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

export type Pattern<Return, Params, Ran extends boolean> = Partial<{
  Root: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  HasMany: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  BelongsTo: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  ManyToMany: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RQLValue<Params, Ran>, as?: string, cast?: string) => Return;
  Call: (name: string, members: AstNode<Params>[], as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
}>;
