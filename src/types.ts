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
export type SQLTag_ = SQLTag<any, any> | ((t: Table) => SQLTag<any, any>);

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

export interface Identifier extends Aliasable, Castable {
  type: "Identifier";
  name: string;
}

export interface Variable extends Castable {
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

export interface Root {
  table: Table;
  type: "Root";
  members: ASTNode[];
  // of params noemen ?
  keywords: Keywords;
}

export interface HasMany {
  table: Table;
  type: "HasMany";
  members: ASTNode[];
  keywords: Keywords;
}

export interface BelongsTo {
  table: Table;
  type: "BelongsTo";
  members: ASTNode[];
  keywords: Keywords;
}

export interface ManyToMany {
  table: Table;
  type: "ManyToMany";
  members: ASTNode[];
  keywords: Keywords;
}

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
  Identifier | ASTRelation |
  Subselect | Call | Variable | Literal;

export interface Next {
  exp: HasMany | BelongsTo | ManyToMany;
  refs: RefsNew;
}


export interface EnvRecord {
  table?: Table;
  query?: string;
  sql?: string;
  fn?: string;
  comps?: string[];
  values?: Values;
  keyIdx?: number;
  inFunction?: boolean;
  isRoot?: boolean; // nog nodig ?
  next?: Next[];
  refs?: RefsNew;
}

export interface CompiledQuery {
  query: string;
  values: Values;
  table: Table;
  next: Next[];
}

// export type TagFn = {
//   (baseTag: RQLTag, ...snippets: any[]): RQLTag;
//   (baseTag: SQLTag, ...snippets: any[]): SQLTag;
//   (baseTag: RQLTag | SQLTag, ...snippets: any[]): RQLTag | SQLTag;
// };

export type TagFn = {
  (baseTag: any, ...snippets: any[]): any;
  (baseTag: SQLTag<any, any>, ...snippets: any[]): SQLTag<any, any>;
  (baseTag: any | SQLTag<any, any>, ...snippets: any[]): any | SQLTag<any, any>;
};

export interface DBRef {
  tableFrom: string;
  constraint: string;
}

export type Primitive = string | number | boolean;

export type RQLValue<Input> = ((p: Input, t: Table) => any) | Primitive | TableRefs | Link[] | Keywords;
export type Values = any[];

export type Querier = (query: string, values: Values) => Promise<any[]>;

export type Rules = [RegExp, string][];

export type ASTType = "Root" | "HasMany" | "ManyToMany" | "BelongsTo";

export type Transformations = {
  [key in keyof EnvRecord]: (value: NonNullable<EnvRecord[key]>) => EnvRecord[key];
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