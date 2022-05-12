import Environment from "./Environment";
import JBOInterpreter from "./JBOInterpreter";
import Raw from "./Raw";
import SQLTag from "./SQLTag";
import Table from "./Table";
import Tokenizer from "./Tokenizer";

export type CaseType = "camel" | "snake";
export type OptCaseType = CaseType | undefined;

export interface RefQLConfig {
  debug?: (query: string, values: Values, ast?: TableType) => void;
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

export interface Rel {
  constructor:
    (symbol: string) => (tag: RQLTag) => Rel;
  "@@rql/type": "Rel";
  symbol: string;
  tag: RQLTag;
}

export type SQLTag_ = SQLTag | ((t: Table) => SQLTag);

export interface Sub {
  constructor:
    (as: string, tag: SQLTag_) => Sub;
  "@@rql/type": "Sub";
  as: string;
  tag: SQLTag_;
}

export interface JsonBuildObject<T> {
  json_build_object: T;
}

export interface RQLTagConstructor {
  (string: string, keys: RQLValue[]): RQLTag;
  transform: <T>(config: RefQLConfig, rows: JsonBuildObject<T>[]) => T[];
}

export interface RQLTag {
  constructor: RQLTagConstructor;
  "@@rql/type": "RQLTag";
  string: string;
  keys: RQLValue[];
  include: (snip) => RQLTag;
  compile: (config: RefQLConfig) => [string, Values, TableType?];
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


export interface TableType extends Omit<Identifier, "type">, Omit<Keywords, "as"> {
  type: "Table";
  members: ASTType[];
}

export interface Relation {
  include: TableType;
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
  TableType | Identifier | HasMany | BelongsTo | ManyToMany |
  Subselect | Call | Variable | Literal;

export type RQLType = Raw | Rel | Sub | Table | SQLTag | RQLTag |
  Tokenizer | Parser | Environment | JBOInterpreter;

export interface Parser {
  constructor:
    (caseTypeDB: OptCaseType, caseTypeJS: OptCaseType, pluralize: boolean, plurals: Plurals) => Parser;
  "@@rql/type": "Parser";
  caseTypeDB?: CaseType;
  caseTypeJS?: CaseType;
  pluralize: boolean;
  plurals: Plurals;
  tokenizer: Tokenizer;
  string: string;
  keys: RQLValue[];
  keyIdx: number;
  lookahead: Token;
  parse: (string: string, keys: RQLValue[]) => TableType;
  Table: (pluralizable?: boolean) => TableType;
  HasMany: () => HasMany;
  BelongsTo: () => BelongsTo;
  ManyToMany: () => ManyToMany;
  Subselect: () => Subselect;
  Identifier: (pluralizable?: boolean) => Identifier;
  Variable: () => Variable;
  Call: (callee: Identifier) => Call;
  Members: () => ASTType[];
  Arguments: () => ASTType[];
  Member: () => ASTType;
  Argument: () => ASTType;
  Literal: () => Literal;
  BooleanLiteral: (value: boolean) => BooleanLiteral;
  NullLiteral: () => NullLiteral;
  NumericLiteral: () => NumericLiteral;
  StringLiteral: () => StringLiteral;
  eat: (tokenType: string) => Token;
  grabVariable: () => RQLValue;
}

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