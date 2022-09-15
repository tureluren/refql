import { refqlType } from "../consts";
import Table from "../Table";
import { CastAs, Pattern, StringMap } from "../types";
import runKeywords from "./runKeywords";

export interface ASTNode {
  cata<Params, Return>(pattern: Pattern<Params, Return>, params: Params, table: Table): Return;
  isASTNode: boolean;
}

const astNodePrototype = {
  isASTNode: true
};

export interface TableNode extends ASTNode {
  table: Table;
  members: ASTNode[];
  keywords: StringMap;
  addMember(node: ASTNode): TableNode;
}

const tableNodePrototype = Object.assign ({}, astNodePrototype, {
  addMember: TableNode$prototype$addMember,
  cata: TableNode$prototype$cata
});

function TableNode$prototype$addMember(this: TableNode, node: ASTNode) {
  return this.constructor (
    this.table,
    this.members.concat (node),
    this.keywords
  );
}

function TableNode$prototype$cata(this: TableNode, pattern: StringMap, params: StringMap) {
  return pattern[this.constructor.name] (
    this.table,
    this.members,
    runKeywords (params, this.table, this.keywords)
  );
}

export interface Root extends TableNode {
  addMember(node: ASTNode): Root;
}

const rootType = "refql/Root";

export function Root(table: Table, members: ASTNode[], keywords: StringMap) {
  let root: Root = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: Root, [refqlType]: rootType })
  );

  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

Root.isRoot = function (value: any): value is Root {
  return value[refqlType] === rootType;
};

export interface HasMany extends TableNode {
  addMember(node: ASTNode): HasMany;
}

const hasManyType = "refql/HasMany";

export function HasMany(table: Table, members: ASTNode[], keywords: StringMap) {
  let hasMany: HasMany = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: HasMany, [refqlType]: hasManyType })
  );

  hasMany.table = table;
  hasMany.members = members;
  hasMany.keywords = keywords;

  return hasMany;
}

HasMany.isHasMany = function (value: any): value is HasMany {
  return value[refqlType] === hasManyType;
};

export interface BelongsTo extends TableNode {
  addMember (node: ASTNode): BelongsTo;
}

const belongsToType = "refql/BelongsTo";

export function BelongsTo(table: Table, members: ASTNode[], keywords: StringMap) {
  let belongsTo: BelongsTo = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: BelongsTo, [refqlType]: belongsToType })
  );

  belongsTo.table = table;
  belongsTo.members = members;
  belongsTo.keywords = keywords;

  return belongsTo;
}

BelongsTo.isBelongsTo = function (value: any): value is BelongsTo {
  return value[refqlType] === belongsToType;
};

export interface ManyToMany extends TableNode {
  addMember(node: ASTNode): ManyToMany;
}

const manyToManyType = "refql/ManyToMany";

export function ManyToMany(table: Table, members: ASTNode[], keywords: StringMap) {
  let manyToMany: ManyToMany = Object.create (
    Object.assign ({}, tableNodePrototype, { constructor: ManyToMany, [refqlType]: manyToManyType })
  );

  manyToMany.table = table;
  manyToMany.members = members;
  manyToMany.keywords = keywords;

  return manyToMany;
}

ManyToMany.isManyToMany = function (value: any): value is ManyToMany {
  return value[refqlType] === manyToManyType;
};

export interface Call extends ASTNode, CastAs {
  name: string;
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

export interface Variable extends ASTNode, CastAs {
  value: any;
}

const variablePrototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  cata: Variable$prototype$cata
});

export function Variable(value: any, as?: string, cast?: string) {
  let variable: Variable = Object.create (variablePrototype);

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function Variable$prototype$cata(this: Variable, pattern: StringMap, params: StringMap, table: Table) {
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