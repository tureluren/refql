import RQLTag from "./RQLTag";
import SQLTag from "./SQLTag";
import Table from "./Table";

export type CaseType = "camel" | "snake";
export type OptCaseType = CaseType | undefined;

export interface RefQLConfig {
  debug?: (query: string, values: Values, ast?: AST) => void;
  detectRefs: boolean;
  caseTypeDB?: CaseType;
  caseTypeJS?: CaseType;
  pluralize: boolean;
  plurals: Plurals;
  refs: Refs;
  useSmartAlias: boolean;
}

export type Link = [string, string];
export type TableRefsObject = { [tableTo: string]: Link[] };
export type Refs = { [tableFrom: string]: TableRefsObject };
export type SQLTag_ = SQLTag | ((t: Table) => SQLTag);

export interface JsonBuildObject<T> {
  json_build_object: T;
}

export type Spec = [RegExp, string | null][];

export type Token = {
  type: string;
  value: string;
};

export interface Keywords {
  as?: string;
  links?: Link[];
  refs?: TableRefsObject;
  xTable?: string;
  orderBy?: SQLTag_;
  id?: number | string;
  limit?: number;
  offset?: number;
}

export type Plurals = {
  [singular: string]: string;
};

export interface Aliasable {
  as: string;
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
  idx: number;
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

export interface AST extends Omit<Identifier, "type">, Omit<Keywords, "as"> {
  type: "AST";
  members: ASTType[];
}

export interface Relation {
  include: AST;
}

export interface HasMany extends Relation {
  type: "HasMany";
}

export interface BelongsTo extends Relation {
  type: "BelongsTo";
}

export interface ManyToMany extends Relation {
  type: "ManyToMany";
}

export interface Subselect extends Omit<Identifier, "type"> {
  type: "Subselect";
  tag: SQLTag_;
}

export interface Call extends Omit<Identifier, "type"> {
  type: "Call";
  args: ASTType[];
}

export type Literal =
  StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral;

export type ASTType =
  AST | Identifier | HasMany | BelongsTo | ManyToMany |
  Subselect | Call | Variable | Literal;

export interface EnvRecord {
  table?: Table;
  query?: string;
  sql?: string;
  values?: Values;
  keyIdx?: number;
  inFunction?: boolean;
  isRoot?: boolean;
}

export type TagFn = {
  (baseTag: RQLTag, ...snippets): RQLTag;
  (baseTag: SQLTag, ...snippets): SQLTag;
  (baseTag: RQLTag | SQLTag, ...snippets): RQLTag | SQLTag;
};

export type ConvertRefsFn = {
  (caseType: OptCaseType, refs: Refs): Refs;
  (caseType: OptCaseType, refs: TableRefsObject): TableRefsObject;
};

export interface DBRef {
  tableFrom: string;
  constraint: string;
}

export interface ExtraEvents {
  on: (event: "ready", listener: () => void) => this;
}

export type RQLValue = ((t: Table) => SQLTag) | string | number | boolean | TableRefsObject | Link[] | Keywords & object;
export type Values = any[];