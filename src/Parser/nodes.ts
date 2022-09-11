import Table from "../Table";
import { Keywords, Pattern, RefQLValue, TableNode } from "../types";
import runKeywords from "./runKeywords";

// Kan weg ?
interface ASTNode2<Params = {}, Ran extends boolean = false> {}

const astNodePrototype = {
  constructor: ASTNode2
};

function ASTNode2() {
  throw new Error ("can't");
}

ASTNode2.prototype = Object.create (astNodePrototype);


interface Root2<Params = {}, Ran extends boolean = false> {
  table: Table;
  members: ASTNode2<Params>[];
  keywords: Keywords<Params, Ran>;
  addMember<Params2 = {}>(node: ASTNode2<Params2>): Root2<Params & Params2>;
  cata<Return = any>(pattern: Pattern<Return, Params, Ran>): Return;
  run(params: Params, _table: Table): Root2<Params, true>;
}

function Root2<Params = {}, Ran extends boolean = true>(table: Table, members: ASTNode2<Params>[], keywords: Keywords<Params, Ran>) {
  let root: Root2<Params, Ran> = Object.create (Root2.prototype);
  root.table = table;
  root.members = members;
  root.keywords = keywords;

  return root;
}

// isASTNode

Root2.prototype = Object.create ({
  constructor: Root2,
  addMember
});

function addMember(this: TableNode, node: ASTNode2) {
  const members = this.members.concat (node as any);
  return this.constructor (
    this.table,
    members,
    this.keywords
  );
}


// function cata(this: Root2, pattern: Pattern) {
//   return pattern.Root! (this.table, this.members, this.keywords);
// }

// function run<Params = {}>(this: Root2, params: Params, _table: Table) {
//   return Root2<Params, true> (
//     this.table,
//     this.members,
//     runKeywords (params, this.table, this.keywords)
//   );
// }

// ---------------------------------------------------

export abstract class ASTNode<Params = {}, Ran extends boolean = false> {
  abstract cata<Return>(pattern: Pattern<Return, Params, Ran>): Return;
  abstract run(params: Params, table: Table): ASTNode<Params, true>;
}

export class Root<Params = {}, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
    super ();
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  addMember<Params2>(node: ASTNode<Params2>): Root<Params & Params2> {
    const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
    return new Root<Params & Params2> (
      this.table,
      members,
      this.keywords as Keywords<Params & Params2>
    );
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.Root! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new Root<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }
}

export class HasMany<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
    super ();
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  addMember<Params2>(node: ASTNode<Params2>): HasMany<Params & Params2> {
    const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
    return new HasMany<Params & Params2> (
      this.table,
      members,
      this.keywords as Keywords<Params & Params2>
    );
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.HasMany! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new HasMany<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }
}

export class BelongsTo<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
    super ();
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  addMember<Params2>(node: ASTNode<Params2>): BelongsTo<Params & Params2> {
    const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
    return new BelongsTo<Params & Params2> (
      this.table,
      members,
      this.keywords as Keywords<Params & Params2>
    );
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.BelongsTo! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new BelongsTo<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }
}

export class ManyToMany<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  table: Table;
  members: ASTNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: ASTNode<Params>[], keywords: Keywords<Params, Ran>) {
    super ();
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  addMember<Params2>(node: ASTNode<Params2>): ManyToMany<Params & Params2> {
    const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
    return new ManyToMany<Params & Params2> (
      this.table,
      members,
      this.keywords as Keywords<Params & Params2>
    );
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.ManyToMany! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new ManyToMany<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }
}

export class Call<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  name: string;
  members: ASTNode<Params>[];
  as?: string;
  cast?: string;

  constructor(name: string, args: ASTNode<Params>[], as?: string, cast?: string) {
    super ();
    this.name = name;
    this.members = args;
    this.as = as;
    this.cast = cast;
  }

  addMember<Params2>(node: ASTNode<Params2>): Call<Params & Params2> {
    const members = (this.members as ASTNode<Params & Params2>[]).concat (node);
    return new Call<Params & Params2> (
      this.name, members, this.as, this.cast
    );
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.Call! (this.name, this.members, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new Call<Params, true> (this.name, this.members, this.as, this.cast);
  }
}

export class Identifier<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  name: string;
  as?: string;
  cast?: string;

  constructor(name: string, as?: string, cast?: string) {
    super ();
    this.name = name;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.Identifier! (this.name, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new Identifier<Params, true> (this.name, this.as, this.cast);
  }
}

export class All <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  sign: string;

  constructor(sign: string) {
    super ();
    this.sign = sign;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.All! (this.sign);
  }

  run(_params: Params, _table: Table) {
    return new All<Params, true> (this.sign);
  }
}

export class Variable<Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: RefQLValue<Params, Ran>;
  as?: string;
  cast?: string;

  constructor(value: RefQLValue<Params, Ran>, as?: string, cast?: string) {
    super ();
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.Variable! (this.value, this.as, this.cast);
  }

  run(params: Params, table: Table) {
    const ran: RefQLValue<Params, true> = typeof this.value === "function"
      ? this.value (params, table)
      : this.value;

    return new Variable<Params, true> (
      ran,
      this.as,
      this.cast
    );
  }
}

export class StringLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: string;
  as?: string;
  cast?: string;

  constructor(value: string, as?: string, cast?: string) {
    super ();
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.StringLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new StringLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class NumericLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: number;
  as?: string;
  cast?: string;

  constructor(value: number, as?: string, cast?: string) {
    super ();
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.NumericLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new NumericLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class BooleanLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: boolean;
  as?: string;
  cast?: string;

  constructor(value: boolean, as?: string, cast?: string) {
    super ();
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.BooleanLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new BooleanLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class NullLiteral <Params, Ran extends boolean = false> extends ASTNode<Params, Ran> {
  value: null;
  as?: string;
  cast?: string;

  constructor(value: null, as?: string, cast?: string) {
    super ();
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<Return>(pattern: Pattern<Return, Params, Ran>) {
    return pattern.NullLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new NullLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

const aRoot = Root2 (Table ("player"), [], {}).addMember (new Identifier ("jd"));

console.log (aRoot);