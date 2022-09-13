import Table from "../Table";
import { Keywords, Literal, Pattern, RefQLValue, StringMap, TableNode } from "../types";
import runKeywords from "./runKeywords";

export interface ASTNode<Params = {}, Ran extends boolean = false> {
  cata<Return = any>(pattern: Pattern<Return, Params, Ran>): Return;
  run(params: Params, table: Table): ASTNode<Params, true>;
  isASTNode(): boolean;
}

export interface Root<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode<Params2>): Root<Params & Params2>;
  run(params: Params, table: Table): Root<Params, true>;
}

export interface HasMany<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode<Params2>): HasMany<Params & Params2>;
  run(params: Params, table: Table): HasMany<Params, true>;
  // isASTNode(): boolean;
}

export interface BelongsTo<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode<Params2>): BelongsTo<Params & Params2>;
  run(params: Params, table: Table): BelongsTo<Params, true>;
  // isASTNode(): boolean;
}

export interface ManyToMany<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode<Params2>): ManyToMany<Params & Params2>;
  run(params: Params, table: Table): ManyToMany<Params, true>;
  // isASTNode(): boolean;
}


const tableNodePrototype = {
  addMember: TableNode$prototype$addMember,
  cata: TableNode$prototype$cata,
  run: TableNode$prototype$run,
  isASTNode: true
};

function TableNode$prototype$addMember(this: TableNode, node: ASTNode) {
  return this.constructor (
    this.table,
    this.members.concat (node),
    this.keywords
  );
}

function TableNode$prototype$cata(this: TableNode, pattern: StringMap) {
  return pattern[this.constructor.name] (this.table, this.members, this.keywords);
}

function TableNode$prototype$run(this: TableNode, params: StringMap, _table: Table) {
  return this.constructor (
    this.table,
    this.members,
    runKeywords (params, this.table, this.keywords)
  );
}

export function Root<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let root: Root<Params> = Object.assign (
    Object.create (Root.prototype), { constructor: Root }, tableNodePrototype
  );

  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

// const ro = Root (Table ("plaue"), [], {});
// console.log (ro);

export function HasMany<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let hasMany: HasMany<Params> = Object.assign (
    Object.create (HasMany.prototype), { constructor: HasMany }, tableNodePrototype
  );

  hasMany.table = table;
  hasMany.members = members;
  hasMany.keywords = keywords;

  return hasMany;
}

HasMany.isHasMany = function (value: any): value is HasMany {
  return value instanceof HasMany;
};


export function BelongsTo<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let belongsTo: BelongsTo<Params> = Object.assign (
    Object.create (BelongsTo.prototype), { constructor: BelongsTo }, tableNodePrototype
  );

  belongsTo.table = table;
  belongsTo.members = members;
  belongsTo.keywords = keywords;

  return belongsTo;
}

BelongsTo.isBelongsTo = function (value: any): value is BelongsTo {
  return value instanceof BelongsTo;
};

export function ManyToMany<Params = {}>(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params>) {
  let manyToMany: ManyToMany<Params> = Object.assign (
    Object.create (ManyToMany.prototype), { constructor: ManyToMany }, tableNodePrototype
  );

  manyToMany.table = table;
  manyToMany.members = members;
  manyToMany.keywords = keywords;

  return manyToMany;
}

ManyToMany.isManyToMany = function (value: any): value is ManyToMany {
  return value instanceof ManyToMany;
};

// ---------------------------------------------------

export interface Call<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  name: string;
  members: ASTNode<Params>[];
  as?: string;
  cast?: string;
  addMember<Params2 = {}>(node: ASTNode<Params2>): ManyToMany<Params & Params2>;
  run(params: Params, table: Table): Call<Params, true>;
  // isASTNode(): boolean;
}

const callPrototype = {
  constructor: Call,
  addMember: Call$prototype$addMember,
  cata: Call$prototype$cata,
  run: Call$prototype$run,
  isASTNode: true
};

export function Call<Params = {}>(name: string, members: ASTNode<Params>[], as?: string, cast?: string) {
  let call: Call<Params> = Object.assign (
    Object.create (Call.prototype), callPrototype
  );

  call.name = name;
  call.members = members;
  call.as = as;
  call.cast = cast;

  return call;
}

function Call$prototype$addMember(this: Call, node: ASTNode): Call {
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

export interface Identifier<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  name: string;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): Call<Params, true>;
  // isASTNode(): boolean;
}

const identifierPrototype = {
  constructor: Call,
  cata: Identifier$prototype$cata,
  run: Identifier$prototype$run,
  isASTNode: true
};

export function Identifier<Params = {}>(name: string, as?: string, cast?: string) {
  let identifier: Identifier<Params> = Object.assign (
    Object.create (Identifier.prototype), identifierPrototype
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
  // isASTNode(): boolean;
}

const allPrototype = {
  constructor: Call,
  cata: All$prototype$cata,
  run: All$prototype$run,
  isASTNode: true
};

export function All<Params = {}>(sign: string) {
  let all: All<Params> = Object.assign (
    Object.create (All.prototype), allPrototype
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



export interface Variable<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: RefQLValue<Params, Ran>;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): Variable<Params, true>;
  // isASTNode(): boolean;
}

const variablePrototype = {
  constructor: Call,
  cata: Variable$prototype$cata,
  run: Variable$prototype$run,
  isASTNode: true
};

export function Variable<Params = {}>(value: RefQLValue<Params>, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.assign (
    Object.create (Variable.prototype), variablePrototype
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



const literalPrototype = {
  cata: Literal$prototype$cata,
  run: Literal$prototype$run,
  isASTNode: true
};

function Literal$prototype$cata(this: Literal, pattern: StringMap) {
  return pattern[this.constructor.name] (this.value, this.as, this.cast);
}

function Literal$prototype$run(this: Literal, _params: StringMap, _table: Table) {
  return this.constructor (this.value, this.as, this.cast);
}

export interface StringLiteral<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: string;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): StringLiteral<Params, true>;
  // isASTNode(): boolean;
}

export function StringLiteral<Params = {}>(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral<Params> = Object.assign (
    Object.create (StringLiteral.prototype), { constructor: StringLiteral }, literalPrototype
  );

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

export interface NumericLiteral<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: number;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): NumericLiteral<Params, true>;
  // isASTNode(): boolean;
}

export function NumericLiteral<Params = {}>(value: number, as?: string, cast?: string) {
  let numericLiteral: NumericLiteral<Params> = Object.assign (
    Object.create (NumericLiteral.prototype), { constructor: NumericLiteral }, literalPrototype
  );

  numericLiteral.value = value;
  numericLiteral.as = as;
  numericLiteral.cast = cast;

  return numericLiteral;
}


export interface BooleanLiteral<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: boolean;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): BooleanLiteral<Params, true>;
  // isASTNode(): boolean;
}

export function BooleanLiteral<Params = {}>(value: boolean, as?: string, cast?: string) {
  let booleanLiteral: BooleanLiteral<Params> = Object.assign (
    Object.create (BooleanLiteral.prototype), { constructor: BooleanLiteral }, literalPrototype
  );

  booleanLiteral.value = value;
  booleanLiteral.as = as;
  booleanLiteral.cast = cast;

  return booleanLiteral;
}

export interface NullLiteral<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: null;
  as?: string;
  cast?: string;
  run(params: Params, table: Table): NullLiteral<Params, true>;
  // isASTNode(): boolean;
}

export function NullLiteral<Params = {}>(value: null, as?: string, cast?: string) {
  let nullLiteral: NullLiteral<Params> = Object.assign (
    Object.create (NullLiteral.prototype), { constructor: NullLiteral }, literalPrototype
  );

  nullLiteral.value = value;
  nullLiteral.as = as;
  nullLiteral.cast = cast;

  return nullLiteral;
}


// export abstract class ASTNode<Params = {}, Ran extends boolean = false> {
//   abstract cata<Return>(pattern: Pattern<Return, Params, Ran>): Return;
//   abstract run(params: Params, table: Table): ASTNode<Params, true>;
// }

// export class Root<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   table: Table;
//   members: ASTNode<Params>[];
//   keywords: Keywords<Params, Ran>;

//   constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
//     super ();
//     this.table = table;
//     this.members = members;
//     this.keywords = keywords;
//   }

//   addMember<Params2>(node: ASTNode<Params2>): Root<Params & Params2> {
//     const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
//     return Root<Params & Params2> (
//       this.table,
//       members,
//       this.keywords as Keywords<Params & Params2>
//     );
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.Root! (this.table, this.members, this.keywords);
//   }

//   run(params: Params, _table: Table) {
//     return Root<Params, true> (
//       this.table,
//       this.members,
//       runKeywords (params, this.table, this.keywords)
//     );
//   }
// }

// export class HasMany<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   table: Table;
//   members: ASTNode<Params>[];
//   keywords: Keywords<Params, Ran>;

//   constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
//     super ();
//     this.table = table;
//     this.members = members;
//     this.keywords = keywords;
//   }

//   addMember<Params2>(node: ASTNode<Params2>): HasMany<Params & Params2> {
//     const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
//     return HasMany<Params & Params2> (
//       this.table,
//       members,
//       this.keywords as Keywords<Params & Params2>
//     );
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.HasMany! (this.table, this.members, this.keywords);
//   }

//   run(params: Params, _table: Table) {
//     return HasMany<Params, true> (
//       this.table,
//       this.members,
//       runKeywords (params, this.table, this.keywords)
//     );
//   }
// }

// export class BelongsTo<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   table: Table;
//   members: ASTNode<Params>[];
//   keywords: Keywords<Params, Ran>;

//   constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
//     super ();
//     this.table = table;
//     this.members = members;
//     this.keywords = keywords;
//   }

//   addMember<Params2>(node: ASTNode<Params2>): BelongsTo<Params & Params2> {
//     const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
//     return BelongsTo<Params & Params2> (
//       this.table,
//       members,
//       this.keywords as Keywords<Params & Params2>
//     );
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.BelongsTo! (this.table, this.members, this.keywords);
//   }

//   run(params: Params, _table: Table) {
//     return BelongsTo<Params, true> (
//       this.table,
//       this.members,
//       runKeywords (params, this.table, this.keywords)
//     );
//   }
// }

// export class ManyToMany<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   table: Table;
//   members: ASTNode<Params>[];
//   keywords: Keywords<Params, Ran>;

//   constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
//     super ();
//     this.table = table;
//     this.members = members;
//     this.keywords = keywords;
//   }

//   addMember<Params2>(node: ASTNode<Params2>): ManyToMany<Params & Params2> {
//     const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
//     return ManyToMany<Params & Params2> (
//       this.table,
//       members,
//       this.keywords as Keywords<Params & Params2>
//     );
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.ManyToMany! (this.table, this.members, this.keywords);
//   }

//   run(params: Params, _table: Table) {
//     return ManyToMany<Params, true> (
//       this.table,
//       this.members,
//       runKeywords (params, this.table, this.keywords)
//     );
//   }
// }

// export class Call<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   name: string;
//   members: ASTNode<Params>[];
//   as?: string;
//   cast?: string;

//   constructor(name: string, args: ASTNode<Params>[], as?: string, cast?: string) {
//     super ();
//     this.name = name;
//     this.members = args;
//     this.as = as;
//     this.cast = cast;
//   }

//   addMember<Params2>(node: ASTNode<Params2>): Call<Params & Params2> {
//     const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
//     return Call<Params & Params2> (
//       this.name, members, this.as, this.cast
//     );
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.Call! (this.name, this.members, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return Call<Params, true> (this.name, this.members, this.as, this.cast);
//   }
// }

// export class Identifier<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   name: string;
//   as?: string;
//   cast?: string;

//   constructor(name: string, as?: string, cast?: string) {
//     super ();
//     this.name = name;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.Identifier! (this.name, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return Identifier<Params, true> (this.name, this.as, this.cast);
//   }
// }

// export class All <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   sign: string;

//   constructor(sign: string) {
//     super ();
//     this.sign = sign;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.All! (this.sign);
//   }

//   run(_params: Params, _table: Table) {
//     return All<Params, true> (this.sign);
//   }
// }

// export class Variable<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   value: RefQLValue<Params, Ran>;
//   as?: string;
//   cast?: string;

//   constructor(value: RefQLValue<Params, Ran>, as?: string, cast?: string) {
//     super ();
//     this.value = value;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.Variable! (this.value, this.as, this.cast);
//   }

//   run(params: Params, table: Table) {
//     const ran: RefQLValue<Params, true> = typeof this.value === "function"
//       ? this.value (params, table)
//       : this.value;

//     return Variable<Params, true> (
//       ran,
//       this.as,
//       this.cast
//     );
//   }
// }

// export class StringLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   value: string;
//   as?: string;
//   cast?: string;

//   constructor(value: string, as?: string, cast?: string) {
//     super ();
//     this.value = value;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.StringLiteral! (this.value, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return StringLiteral<Params, true> (this.value, this.as, this.cast);
//   }
// }

// export class NumericLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   value: number;
//   as?: string;
//   cast?: string;

//   constructor(value: number, as?: string, cast?: string) {
//     super ();
//     this.value = value;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.NumericLiteral! (this.value, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return NumericLiteral<Params, true> (this.value, this.as, this.cast);
//   }
// }

// export class BooleanLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   value: boolean;
//   as?: string;
//   cast?: string;

//   constructor(value: boolean, as?: string, cast?: string) {
//     super ();
//     this.value = value;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.BooleanLiteral! (this.value, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return BooleanLiteral<Params, true> (this.value, this.as, this.cast);
//   }
// }

// export class NullLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
//   value: null;
//   as?: string;
//   cast?: string;

//   constructor(value: null, as?: string, cast?: string) {
//     super ();
//     this.value = value;
//     this.as = as;
//     this.cast = cast;
//   }

//   cata<Return>(pattern: Pattern<Return, Params, Ran>) {
//     return pattern.NullLiteral! (this.value, this.as, this.cast);
//   }

//   run(_params: Params, _table: Table) {
//     return NullLiteral<Params, true> (this.value, this.as, this.cast);
//   }
// }