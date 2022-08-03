import Environment from "./Environment2";
import { BelongsTo, HasMany, Identifier, ManyToMany, Root } from "./Parser/Node";
import RQLTag from "./RQLTag";
import SQLTag from "./SQLTag";
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
  refs: Refs;
  useSmartAlias: boolean;
  querier: Querier;
}

export type Link = [string, string];
export type TableRefs = { [tableTo: string]: Link[] };
export type Refs = { [tableFrom: string]: TableRefs };
export type SQLTag_ = SQLTag<any> | ((t: Table) => SQLTag<any>);

export interface JsonBuildObject<T> {
  json_build_object: T;
}

export type Spec = [RegExp, string | null][];

export type Token = {
  type: string;
  value: string;
};

// niet dict extenden, dan is ieder soort object mogelijk als parameter voor sql
export interface Keywords {
  as?: string;
  lkey?: string;
  rkey?: string;
  x?: string;
  lxkey?: string;
  rxkey?: string;


  // orderBy?: SQLTag_;
  id?: number | string;
  limit?: number;
  offset?: number;
}

export type Plurals = {
  [singular: string]: string;
};

export interface Aliasable {
  as?: string;
}

export interface Castable {
  cast?: string;
}

export interface Variable extends Aliasable, Castable {
  type: "Variable";
  value: any;
}

export interface BooleanLiteral extends Aliasable {
  type: "BooleanLiteral";
  value: boolean;
}

export interface NullLiteral extends Aliasable {
  type: "NullLiteral";
  value: null;
}

export interface StringLiteral extends Aliasable {
  type: "StringLiteral";
  value: string;
}

export interface NumericLiteral extends Aliasable {
  type: "NumericLiteral";
  value: number;
}

// remove
export interface Subselect extends Omit<Identifier, "type"> {
  type: "Subselect";
  tag: SQLTag_;
}

export interface Call extends Omit<Identifier, "type"> {
  type: "Call";
  args: ASTNode[];
}

export type Literal =
  StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral;

export type ASTRelation =
  Root | HasMany | BelongsTo | ManyToMany;

export type ASTNode =
  Identifier | ASTRelation;
  // | Subselect | Call | Variable | Literal;

export interface Next {
  exp: HasMany | BelongsTo | ManyToMany;
  refs: RefsNew;
}


export interface EnvRecord<Input> {
  table?: Table;
  query: string;
  sqlTag: SQLTag<Input>;
  comps: string[];
  values: Values;
  next: Next[];
  refs: RefsNew;
}

export interface CompiledQuery {
  query: string;
  values: Values;
  table?: Table;
  next: Next[];
}

// export type TagFn = {
//   (baseTag: RQLTag, ...snippets: any[]): RQLTag;
//   (baseTag: SQLTag, ...snippets: any[]): SQLTag;
//   (baseTag: RQLTag | SQLTag, ...snippets: any[]): RQLTag | SQLTag;
// };

export type TagFn = {
  (baseTag: any, ...snippets: any[]): any;
  (baseTag: SQLTag<any>, ...snippets: any[]): SQLTag<any>;
  (baseTag: any | SQLTag<any>, ...snippets: any[]): any | SQLTag<any>;
};

export interface DBRef {
  tableFrom: string;
  constraint: string;
}

export type Primitive = string | number | boolean;

export type RQLValue<Input> = ((p: Input, t: Table) => any) | Primitive | TableRefs | Link[] | Keywords | SQLTag<Input> ;
export type Values = any[];

export type Querier = (query: string, values: Values) => Promise<any[]>;

export type Rules = [RegExp, string][];

export type ASTType = "Root" | "HasMany" | "ManyToMany" | "BelongsTo";

export type Transformations<Input> = {
  [key in keyof Partial<EnvRecord<Input>>]: (value: NonNullable<EnvRecord<Input>[key]>) => EnvRecord<Input>[key];
};

export interface NamedKeys {
  name: string;
  as: string;
}

export interface RefsNew {
  lkeys: NamedKeys[];
  rkeys: NamedKeys[];
  lxkeys: NamedKeys[];
  rxkeys: NamedKeys[];
}

export type Pattern<R> = {
  Root: (table: Table, members: ASTNode[], keywords: Keywords) => R;
  HasMany: (table: Table, members: ASTNode[], keywords: Keywords) => R;
  BelongsTo: (table: Table, members: ASTNode[], keywords: Keywords) => R;
  ManyToMany: (table: Table, members: ASTNode[], keywords: Keywords) => R;
  Identifier: (name: string, as?: string, cast?: string) => R;
};

export type InterpretFn<Input> = (exp: ASTNode, env?: Environment<Input>, rows?: any[]) => EnvRecord<Input>;