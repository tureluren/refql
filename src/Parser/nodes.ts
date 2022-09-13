import { refqlType } from "../consts";
import Table from "../Table";
import { CastAs, Keywords, Pattern, RefQLValue, StringMap } from "../types";
import runKeywords from "./runKeywords";

export interface ASTNode<Params = {}, Ran extends boolean = false> {
  cata<Return = any>(pattern: Pattern<Return, Params, Ran>): Return;
  run(params: Params, table: Table): ASTNode<Params, true>;
  isASTNode: boolean;
}

const astNodePrototype = {
  isASTNode: true
};

export interface TableNode<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode<Params2>): TableNode<Params & Params2>;
}

const tableNodePrototype = {
  addMember: TableNode$prototype$addMember,
  cata: TableNode$prototype$cata,
  run: TableNode$prototype$run
};

function TableNode$prototype$addMember(this: TableNode, node: ASTNode) {
  return this.constructor (this.table, this.members.concat (node), this.keywords);
}

function TableNode$prototype$cata(this: TableNode, pattern: StringMap) {
  return pattern[this.constructor.name] (this.table, this.members, this.keywords);
}

function TableNode$prototype$run(this: TableNode, params: StringMap, _table: Table) {
  return this.constructor (this.table, this.members, runKeywords (params, this.table, this.keywords));
}

export interface Root<Params = {}, Ran extends boolean = false> extends TableNode<Params, Ran> {
  addMember<Params2 = {}>(node: ASTNode<Params2>): Root<Params & Params2>;
  run(params: Params, table: Table): Root<Params, true>;
}

const rootType = "refql/Root";

export function Root<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let root: Root<Params> = Object.create (
    Object.assign ({}, astNodePrototype, tableNodePrototype, { constructor: Root, [refqlType]: rootType })
  );

  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

Root.isRoot = function <Params = {}> (value: any): value is Root<Params> {
  return value[refqlType] === rootType;
};

export interface HasMany<Params = {}, Ran extends boolean = false> extends TableNode<Params, Ran> {
  addMember<Params2 = {}>(node: ASTNode<Params2>): HasMany<Params & Params2>;
  run(params: Params, table: Table): HasMany<Params, true>;
}

const hasManyType = "refql/HasMany";

export function HasMany<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let hasMany: HasMany<Params> = Object.create (
    Object.assign ({}, astNodePrototype, tableNodePrototype, { constructor: HasMany, [refqlType]: hasManyType })
  );

  hasMany.table = table;
  hasMany.members = members;
  hasMany.keywords = keywords;

  return hasMany;
}

HasMany.isHasMany = function <Params = {}> (value: any): value is HasMany<Params> {
  return value[refqlType] === hasManyType;
};

export interface BelongsTo<Params = {}, Ran extends boolean = false> extends TableNode<Params, Ran> {
  addMember<Params2 = {}>(node: ASTNode<Params2>): BelongsTo<Params & Params2>;
  run(params: Params, table: Table): BelongsTo<Params, true>;
}

const belongsToType = "refql/BelongsTo";

export function BelongsTo<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let belongsTo: BelongsTo<Params> = Object.create (
    Object.assign ({}, astNodePrototype, tableNodePrototype, { constructor: BelongsTo, [refqlType]: belongsToType })
  );

  belongsTo.table = table;
  belongsTo.members = members;
  belongsTo.keywords = keywords;

  return belongsTo;
}

BelongsTo.isBelongsTo = function <Params = {}> (value: any): value is BelongsTo<Params> {
  return value[refqlType] === belongsToType;
};

export interface ManyToMany<Params = {}, Ran extends boolean = false> extends TableNode<Params, Ran> {
  addMember<Params2 = {}>(node: ASTNode<Params2>): ManyToMany<Params & Params2>;
  run(params: Params, table: Table): ManyToMany<Params, true>;
}

const manyToManyType = "refql/ManyToMany";

export function ManyToMany<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let manyToMany: ManyToMany<Params> = Object.create (
    Object.assign ({}, astNodePrototype, tableNodePrototype, { constructor: ManyToMany, [refqlType]: manyToManyType })
  );

  manyToMany.table = table;
  manyToMany.members = members;
  manyToMany.keywords = keywords;

  return manyToMany;
}

ManyToMany.isManyToMany = function <Params = {}> (value: any): value is ManyToMany<Params> {
  return value[refqlType] === manyToManyType;
};

export interface Call<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran>, CastAs {
  name: string;
  members: ASTNode<Params>[];
  addMember<Params2 = {}>(node: ASTNode<Params2>): ManyToMany<Params & Params2>;
  run(params: Params, table: Table): Call<Params, true>;
}

const callPrototype = {
  constructor: Call,
  addMember: Call$prototype$addMember,
  cata: Call$prototype$cata,
  run: Call$prototype$run
};

export function Call<Params = {}>(name: string, members: ASTNode<Params>[], as?: string, cast?: string) {
  let call: Call<Params> = Object.create (
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

function Call$prototype$run(this: Call, _params: StringMap, _table: Table) {
  return Call (this.name, this.members, this.as, this.cast);
}

export interface Identifier<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran>, CastAs {
  name: string;
  run(params: Params, table: Table): Identifier<Params, true>;
}

const identifierPrototype = {
  constructor: Identifier,
  cata: Identifier$prototype$cata,
  run: Identifier$prototype$run
};

export function Identifier<Params = {}>(name: string, as?: string, cast?: string) {
  let identifier: Identifier<Params> = Object.create (
    Object.assign ({}, astNodePrototype, identifierPrototype)
  );

  identifier.name = name;
  identifier.as = as;
  identifier.cast = cast;

  return identifier;
}

function Identifier$prototype$cata(this: Identifier, pattern: StringMap) {
  return pattern.Identifier (this.name, this.as, this.cast);
}

function Identifier$prototype$run(this: Identifier, _params: StringMap, _table: Table) {
  return Identifier (this.name, this.as, this.cast);
}

export interface All<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  sign: string;
  run(params: Params, table: Table): All<Params, true>;
}

const allPrototype = {
  constructor: All,
  cata: All$prototype$cata,
  run: All$prototype$run
};

export function All<Params = {}>(sign: string) {
  let all: All<Params> = Object.create (
    Object.assign ({}, astNodePrototype, allPrototype)
  );

  all.sign = sign;

  return all;
}

function All$prototype$cata(this: All, pattern: StringMap) {
  return pattern.All (this.sign);
}

function All$prototype$run(this: All, _params: StringMap, _table: Table) {
  return All (this.sign);
}

export interface Variable<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran>, CastAs {
  value: RefQLValue<Params, Ran>;
  run(params: Params, table: Table): Variable<Params, true>;
}

const variablePrototype = {
  constructor: Variable,
  cata: Variable$prototype$cata,
  run: Variable$prototype$run
};

export function Variable<Params = {}>(value: RefQLValue<Params>, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (
    Object.assign ({}, astNodePrototype, variablePrototype)
  );

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function Variable$prototype$cata(this: Variable, pattern: StringMap) {
  return pattern.Variable (this.value, this.as, this.cast);
}

function Variable$prototype$run(this: Variable, params: StringMap, table: Table) {
  const ran: RefQLValue = typeof this.value === "function"
    ? this.value (params, table)
    : this.value;

  return Variable (ran, this.as, this.cast);
}

export interface Literal<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran>, CastAs {
  value: string | number | boolean | null;
}

const literalPrototype = {
  cata: Literal$prototype$cata,
  run: Literal$prototype$run
};

function Literal$prototype$cata(this: Literal, pattern: StringMap) {
  return pattern[this.constructor.name] (this.value, this.as, this.cast);
}

function Literal$prototype$run(this: Literal, _params: StringMap, _table: Table) {
  return this.constructor (this.value, this.as, this.cast);
}

export interface StringLiteral<Params = {}, Ran extends boolean = false> extends Literal<Params, Ran> {
  value: string;
  run(params: Params, table: Table): StringLiteral<Params, true>;
}

export function StringLiteral<Params = {}>(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral<Params> = Object.create (
    Object.assign ({}, astNodePrototype, literalPrototype, { constructor: StringLiteral })
  );

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

export interface NumericLiteral<Params = {}, Ran extends boolean = false> extends Literal<Params, Ran> {
  value: number;
  run(params: Params, table: Table): NumericLiteral<Params, true>;
}

export function NumericLiteral<Params = {}>(value: number, as?: string, cast?: string) {
  let numericLiteral: NumericLiteral<Params> = Object.create (
    Object.assign ({}, astNodePrototype, literalPrototype, { constructor: NumericLiteral })
  );

  numericLiteral.value = value;
  numericLiteral.as = as;
  numericLiteral.cast = cast;

  return numericLiteral;
}

export interface BooleanLiteral<Params = {}, Ran extends boolean = false> extends Literal<Params, Ran> {
  value: boolean;
  run(params: Params, table: Table): BooleanLiteral<Params, true>;
}

export function BooleanLiteral<Params = {}>(value: boolean, as?: string, cast?: string) {
  let booleanLiteral: BooleanLiteral<Params> = Object.create (
    Object.assign ({}, astNodePrototype, literalPrototype, { constructor: BooleanLiteral })
  );

  booleanLiteral.value = value;
  booleanLiteral.as = as;
  booleanLiteral.cast = cast;

  return booleanLiteral;
}

export interface NullLiteral<Params = {}, Ran extends boolean = false> extends Literal<Params, Ran> {
  value: null;
  run(params: Params, table: Table): NullLiteral<Params, true>;
}

export function NullLiteral<Params = {}>(value: null, as?: string, cast?: string) {
  let nullLiteral: NullLiteral<Params> = Object.create (
    Object.assign ({}, astNodePrototype, literalPrototype, { constructor: NullLiteral })
  );

  nullLiteral.value = value;
  nullLiteral.as = as;
  nullLiteral.cast = cast;

  return nullLiteral;
}