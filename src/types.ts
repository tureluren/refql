import Env from "./Env";
import { All, BelongsTo, BooleanLiteral, Call, HasMany, Identifier, ManyToMany, NullLiteral, NumericLiteral, Root, StringLiteral, Variable } from "./Parser/nodes";
import SqlTag from "./SqlTag";
import Table from "./Table";

export type CaseType = "camel" | "snake" | undefined;

export interface Dict {
  [key: string]: any;
}

export type Querier<T> = (query: string, values: any[]) => Promise<T[]>;

export interface RefQLConfig extends Dict {
  caseType?: CaseType;
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

export type ParamF<Params, Ret> = (p: Params, T: Table) => Ret;

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

export type KeywordNode <Params, Ran extends boolean = false> =
  | Root<Params, Ran>
  | ManyToMany<Params, Ran>
  | HasMany<Params, Ran>
  | BelongsTo<Params, Ran>;

export type MembersNode <Params, Ran extends boolean = false> =
  | KeywordNode<Params, Ran>
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
  values: any[];
  next: Next<Input>[];
  refs: Refs;
  inCall: boolean;
}

export type TagFn = {
  (baseTag: any, ...snippets: any[]): any;
  (baseTag: SqlTag<any>, ...snippets: any[]): SqlTag<any>;
  (baseTag: any | SqlTag<any>, ...snippets: any[]): any | SqlTag<any>;
};

export interface DBRef {
  tableFrom: string;
  constraint: string;
}

export type JsTypes =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | object;

export type RQLValue<Params, Ran extends boolean = false> =
  Ran extends false
  ? JsTypes | SqlTag<Params> | ParamF<Params, JsTypes | SqlTag<Params>>
  : JsTypes | SqlTag<Params>;


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

export type Pattern<Ret, Params, Ran extends boolean> = Partial<{
  Root: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Ret;
  HasMany: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Ret;
  BelongsTo: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Ret;
  ManyToMany: (table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) => Ret;
  All: (sign: string) => Ret;
  Identifier: (name: string, as?: string, cast?: string) => Ret;
  Variable: (value: RQLValue<Params, Ran>, as?: string, cast?: string) => Ret;
  Call: (name: string, members: AstNode<Params>[], as?: string, cast?: string) => Ret;
  StringLiteral: (value: string, as?: string, cast?: string) => Ret;
  NumericLiteral: (value: number, as?: string, cast?: string) => Ret;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Ret;
  NullLiteral: (value: null, as?: string, cast?: string) => Ret;
}>;

export type InterpretF<Params> = (exp: AstNode<Params, true | false>, env: Env<Params>, rows?: any[]) => Rec<Params>;