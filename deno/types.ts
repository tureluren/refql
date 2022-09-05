import Env from "./Env/index.ts";
import {
  ASTNode, BelongsTo, BooleanLiteral,
  HasMany, ManyToMany, NullLiteral,
  NumericLiteral, Root, StringLiteral
} from "./Parser/nodes";
import SQLTag from "./SQLTag/index.ts";
import Table from "./Table/index.ts";

export interface StringMap {
  [key: string]: any;
}

export type Querier<T> = (query: string, values: any[]) => Promise<T[]>;

export type Rules = [RegExp, string][];

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

export type Literal <Params, Ran extends boolean = false> =
  | StringLiteral<Params, Ran>
  | NumericLiteral<Params, Ran>
  | BooleanLiteral<Params, Ran>
  | NullLiteral<Params, Ran>;

export type TableNode <Params, Ran extends boolean = false> =
  | Root<Params, Ran>
  | HasMany<Params, Ran>
  | BelongsTo<Params, Ran>
  | ManyToMany<Params, Ran>;

export type Pattern<Return, Params, Ran extends boolean> = Partial<{
  Root: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  HasMany: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  BelongsTo: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  ManyToMany: (table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RefQLValue<Params, Ran>, as?: string, cast?: string) => Return;
  Call: (name: string, members: ASTNode<Params>[], as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
}>;

export type ParamF<Params, Return> = (p: Params, T?: Table) => Return;

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

export interface Next<Params> {
  node: ASTNode <Params, true>;
  refs: Refs;
}

export interface Rec<Params> {
  table: Table;
  query: string;
  sqlTag: SQLTag<Params>;
  comps: string[];
  values: any[];
  next: Next<Params>[];
  refs: Refs;
  inCall: boolean;
}

export type Transformations<Params> = {
  [key in keyof Partial<Rec<Params>>]: (value: Rec<Params>[key]) => Rec<Params>[key];
};

export type BuiltIn =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | object;

export type RefQLValue<Params, Ran extends boolean = false> =
  Ran extends false
  ? BuiltIn | SQLTag<Params> | ParamF<Params, BuiltIn | SQLTag<Params>>
  : BuiltIn | SQLTag<Params>;

export type InterpretF<Params> = (exp: ASTNode<Params, true | false>, env: Env<Params>, rows?: any[]) => Rec<Params>;