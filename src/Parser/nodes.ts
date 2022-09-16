import { refqlType } from "../common/consts";
import { ParamF, RefQLValue, StringMap } from "../common/types";
import Table from "../Table";
import runKeywords from "./runKeywords";

interface CastAs {
  as?: string;
  cast?: string;
}

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

type Pattern<Params, Return> = Partial<{
  Root: (table: Table, members: ASTNode[], keywords: Keywords<Params, true>) => Return;
  HasMany: (table: Table, members: ASTNode[], keywords: Keywords<Params, true>) => Return;
  BelongsTo: (table: Table, members: ASTNode[], keywords: Keywords<Params, true>) => Return;
  ManyToMany: (table: Table, members: ASTNode[], keywords: Keywords<Params, true>) => Return;
  All: (sign: string) => Return;
  Identifier: (name: string, as?: string, cast?: string) => Return;
  Variable: (value: RefQLValue<Params, true>, as?: string, cast?: string) => Return;
  Call: (name: string, members: ASTNode[], as?: string, cast?: string) => Return;
  StringLiteral: (value: string, as?: string, cast?: string) => Return;
  NumericLiteral: (value: number, as?: string, cast?: string) => Return;
  BooleanLiteral: (value: boolean, as?: string, cast?: string) => Return;
  NullLiteral: (value: null, as?: string, cast?: string) => Return;
}>;

export interface ASTNode {
  cata<Params, Return>(pattern: Pattern<Params, Return>, params: Params, table: Table): Return;
  isASTNode: boolean;
}

const astNodePrototype = {
  isASTNode: true
};

export interface TableNode<Params> extends ASTNode {
  table: Table;
  members: ASTNode[];
  keywords: Keywords<Params>;
  // maak type voor TableNode<Params2> | Variable<Params2>, zie ok interfaces root, belongs to, has many, manytomany
  addMember<Params2>(node: ASTNode | TableNode<Params2> | Variable<Params2>): TableNode<Params & Params2>;
}

const tableNodePrototype = Object.assign ({}, astNodePrototype, {
  addMember: TableNode$prototype$addMember,
  cata: TableNode$prototype$cata
});

function TableNode$prototype$addMember<Params>(this: TableNode<Params>, node: ASTNode) {
  return this.constructor (
    this.table,
    this.members.concat (node),
    this.keywords
  );
}

function TableNode$prototype$cata <Params>(this: TableNode<Params>, pattern: StringMap, params: Params) {
  return pattern[this.constructor.name] (
    this.table,
    this.members,
    runKeywords (params, this.table, this.keywords)
  );
}

export interface Root<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode | TableNode<Params2> | Variable<Params2>): Root<Params & Params2>;
}

const rootType = "refql/Root";

export function Root<Params>(table: Table, members: ASTNode[], keywords: Keywords<Params>) {
  let root: Root<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: Root, [refqlType]: rootType })
  );

  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

Root.isRoot = function<Params> (value: any): value is Root<Params> {
  return value != null && value[refqlType] === rootType;
};

export interface HasMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode | TableNode<Params2> | Variable<Params2>): HasMany<Params & Params2>;
}

const hasManyType = "refql/HasMany";

export function HasMany<Params>(table: Table, members: ASTNode[], keywords: Keywords<Params>) {
  let hasMany: HasMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: HasMany, [refqlType]: hasManyType })
  );

  hasMany.table = table;
  hasMany.members = members;
  hasMany.keywords = keywords;

  return hasMany;
}

HasMany.isHasMany = function <Params> (value: any): value is HasMany<Params> {
  return value != null && value[refqlType] === hasManyType;
};

export interface BelongsTo<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode | TableNode<Params2> | Variable<Params2>): BelongsTo<Params & Params2>;
}

const belongsToType = "refql/BelongsTo";

export function BelongsTo<Params>(table: Table, members: ASTNode[], keywords: Keywords<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: BelongsTo, [refqlType]: belongsToType })
  );

  belongsTo.table = table;
  belongsTo.members = members;
  belongsTo.keywords = keywords;

  return belongsTo;
}

BelongsTo.isBelongsTo = function<Params> (value: any): value is BelongsTo<Params> {
  return value != null && value[refqlType] === belongsToType;
};

export interface ManyToMany<Params> extends TableNode<Params> {
  addMember<Params2>(node: ASTNode | TableNode<Params2> | Variable<Params2>): ManyToMany<Params & Params2>;
}

const manyToManyType = "refql/ManyToMany";

export function ManyToMany<Params>(table: Table, members: ASTNode[], keywords: Keywords<Params>) {
  let manyToMany: ManyToMany<Params> = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: ManyToMany, [refqlType]: manyToManyType })
  );

  manyToMany.table = table;
  manyToMany.members = members;
  manyToMany.keywords = keywords;

  return manyToMany;
}

ManyToMany.isManyToMany = function <Params> (value: any): value is ManyToMany<Params> {
  return value != null && value[refqlType] === manyToManyType;
};

export interface Call extends ASTNode, CastAs {
  name: string;
  // geen tablenodes!!!
  members: ASTNode[];
  addMember(node: ASTNode): Call;
}

const callPrototype = {
  constructor: Call,
  addMember: Call$prototype$addMember,
  cata: Call$prototype$cata
};

export function Call(name: string, members: ASTNode[], as?: string, cast?: string) {
  let call: Call = Object.create (
    Object.assign ({}, astNodePrototype, callPrototype)
  );

  call.name = name;
  call.members = members;
  call.as = as;
  call.cast = cast;

  return call;
}

function Call$prototype$addMember(this: Call, node: ASTNode) {
  return Call (
    this.name, this.members.concat (node), this.as, this.cast
  );
}

function Call$prototype$cata(this: Call, pattern: StringMap) {
  return pattern.Call (this.name, this.members, this.as, this.cast);
}

export interface Identifier extends ASTNode, CastAs {
  name: string;
}

const identifierPrototype = Object.assign ({}, astNodePrototype, {
  constructor: Identifier,
  cata: Identifier$prototype$cata
});

export function Identifier(name: string, as?: string, cast?: string) {
  let identifier: Identifier = Object.create (identifierPrototype);

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function Identifier$prototype$cata(this: Identifier, pattern: StringMap) {
  return pattern.Identifier (this.name, this.as, this.cast);
}

export interface All extends ASTNode {
  sign: string;
}

const allPrototype = Object.assign ({}, astNodePrototype, {
  constructor: All,
  cata: All$prototype$cata
});

export function All(sign: string) {
  let all: All = Object.create (allPrototype);

  all.sign = sign;

  return all;
}

function All$prototype$cata(this: All, pattern: StringMap) {
  return pattern.All (this.sign);
}

export interface Variable<Params> extends ASTNode, CastAs {
  value: RefQLValue<Params>;
}

const variablePrototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  cata: Variable$prototype$cata
});

export function Variable<Params>(value: RefQLValue<Params>, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (variablePrototype);

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function Variable$prototype$cata<Params>(this: Variable<Params>, pattern: StringMap, params: Params, table: Table) {
  const ran = typeof this.value === "function"
    ? this.value (params, table)
    : this.value;

  return pattern.Variable (ran, this.as, this.cast);
}

export interface Literal extends ASTNode, CastAs {
  value: string | number | boolean | null;
}

const literalPrototype = Object.assign ({}, astNodePrototype, {
  cata: Literal$prototype$cata
});

function Literal$prototype$cata(this: Literal, pattern: StringMap) {
  return pattern[this.constructor.name] (this.value, this.as, this.cast);
}

export interface StringLiteral extends Literal {
  value: string;
}

export function StringLiteral(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: StringLiteral })
  );

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

export interface NumericLiteral extends Literal {
  value: number;
}

export function NumericLiteral(value: number, as?: string, cast?: string) {
  let numericLiteral: NumericLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: NumericLiteral })
  );

  numericLiteral.value = value;
  numericLiteral.as = as;
  numericLiteral.cast = cast;

  return numericLiteral;
}

export interface BooleanLiteral extends Literal {
  value: boolean;
}

export function BooleanLiteral(value: boolean, as?: string, cast?: string) {
  let booleanLiteral: BooleanLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: BooleanLiteral })
  );

  booleanLiteral.value = value;
  booleanLiteral.as = as;
  booleanLiteral.cast = cast;

  return booleanLiteral;
}

export interface NullLiteral extends Literal {
  value: null;
}

export function NullLiteral(value: null, as?: string, cast?: string) {
  let nullLiteral: NullLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: NullLiteral })
  );

  nullLiteral.value = value;
  nullLiteral.as = as;
  nullLiteral.cast = cast;

  return nullLiteral;
}