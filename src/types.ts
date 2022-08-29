import Environment from "./Env";
import { All, BelongsTo, BooleanLiteral, Call, HasMany, Identifier, ManyToMany, NullLiteral, NumericLiteral, Root, StringLiteral, Variable } from "./Parser/nodes";
import Raw from "./Raw";
import SqlTag from "./SqlTag";
import Table from "./Table";

export type CaseType = "camel" | "snake" | undefined;

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

export type TokenType =
  | "::" | ":" | "{" | "}"
  | "(" | ")" | "," | "VARIABLE"
  | "true" | "false" | "null" | "NUMBER"
  | "<" | "-" | "x" | "*" | "SCHEMA"
  | "IDENTIFIER" | "STRING" | "EOF";

export type Token = {
  type: TokenType | null;
  value: string;
};

export type ParamF<Params, Result> = (p: Params, T: Table) => Result;

export interface Keywords<Params, Ran extends boolean = false> extends Dict {
  xtable?: Ran extends false ? string | ParamF<Params, string> : string;
  lref?: Ran extends false ? string | ParamF<Params, string> : string;
  rref?: Ran extends false ? string | ParamF<Params, string> : string;
  lxref?: Ran extends false ? string | ParamF<Params, string> : string;
  rxref?: Ran extends false ? string | ParamF<Params, string> : string;
  id?: Ran extends false ? number | string | ParamF<Params, number | string> : number | string;
  limit?: Ran extends false ? number | ParamF<Params, number> : number;
  offset?: Ran extends false ? number | ParamF<Params, number> : number;
}

export type Plurals = {
  [singular: string]: string;
};

export type Literal <Params, Ran extends boolean = false> =
  | StringLiteral<Params, Ran>
  | NumericLiteral<Params, Ran>
  | BooleanLiteral<Params, Ran>
  | NullLiteral<Params, Ran>;

export type KeywordsNode <Params, Ran extends boolean = false> =
  | Root<Params, Ran>
  | ManyToMany<Params, Ran>
  | HasMany<Params, Ran>
  | BelongsTo<Params, Ran>;

export type MembersNode <Params, Ran extends boolean = false> =
  | KeywordsNode<Params, Ran>
  | Call<Params, Ran>;

export type AstNode <Params, Ran extends boolean = false> =
  | Identifier<Params, Ran>
  | All<Params, Ran>
  | MembersNode<Params, Ran>
  | Variable <Params, Ran>
  | Literal<Params, Ran>;

export interface Next<Input> {
  node: AstNode <Input, true>;
  refs: Refs;
}

export interface Rec<Input> {
  table: Table;
  query: string;
  sqlTag: SqlTag<Input>;
  comps: string[];
  values: Values;
  next: Next<Input>[];
  refs: Refs;
  inCall: boolean;
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

export type Primitive = string | number | boolean | null;

export type RQLValue<Input, Ran extends boolean = false> =
  Ran extends false
  ? Primitive | SqlTag<Input> | Raw | Table | ParamF<Input, Primitive | SqlTag<Input> | Raw | Table>
  : Primitive | SqlTag<Input> | Raw | Table;

// use primitive
export type Values = any[];

export type Querier = (query: string, values: Values) => Promise<any[]>;

export type Rules = [RegExp, string][];

export type Transformations<Params> = {
  [key in keyof Partial<Rec<Params>>]: (value: Rec<Params>[key]) => Rec<Params>[key];
};

export interface Ref {
  name: string;
  as: string;
}

export interface Refs {
  lrefs: Ref[];
  rrefs: Ref[];
  lxrefs: Ref[];
  rxrefs: Ref[];
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
