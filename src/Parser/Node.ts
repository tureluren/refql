import runKeywords from "../Interpreter/runKeywords";
import isFunction from "../predicate/isFunction";
import Table from "../Table";
import { AstNode, Keywords, Pattern, RQLValue } from "../types";

export class Root<Params, Ran extends boolean = false> {
  table: Table;
  members: AstNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.Root! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new Root<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }

  static of<Params, Ran extends boolean = false>(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    return new Root<Params, Ran> (table, members, keywords);
  }
}

export class HasMany<Params, Ran extends boolean = false> {
  table: Table;
  members: AstNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.HasMany! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new HasMany<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }

  static of<Params, Ran extends boolean = false>(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    return new HasMany<Params, Ran> (table, members, keywords);
  }
}

export class BelongsTo<Params, Ran extends boolean = false> {
  table: Table;
  members: AstNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.BelongsTo! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new BelongsTo<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }

  static of<Params, Ran extends boolean = false>(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    return new BelongsTo<Params, Ran> (table, members, keywords);
  }
}

export class ManyToMany<Params, Ran extends boolean = false> {
  table: Table;
  members: AstNode<Params>[];
  keywords: Keywords<Params, Ran>;

  constructor(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.ManyToMany! (this.table, this.members, this.keywords);
  }

  run(params: Params, _table: Table) {
    return new ManyToMany<Params, true> (
      this.table,
      this.members,
      runKeywords (params, this.table, this.keywords)
    );
  }

  static of<Params, Ran extends boolean = false>(table: Table, members: AstNode<Params>[], keywords: Keywords<Params, Ran>) {
    return new ManyToMany<Params, Ran> (table, members, keywords);
  }
}

export class Call<Params, Ran extends boolean = false> {
  name: string;
  members: AstNode<Params>[];
  as?: string;
  cast?: string;

  constructor(name: string, args: AstNode<Params>[], as?: string, cast?: string) {
    this.name = name;
    this.members = args;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.Call! (this.name, this.members, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new Call<Params, true> (this.name, this.members, this.as, this.cast);
  }

  static of<Params, Ran extends boolean = false>(name: string, args: AstNode<Params>[], as?: string, cast?: string) {
    return new Call (name, args, as, cast);
  }
}

export class Identifier<Params, Ran extends boolean = false> {
  name: string;
  as?: string;
  cast?: string;

  constructor(name: string, as?: string, cast?: string) {
    this.name = name;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.Identifier! (this.name, this.as, this.cast);
  }

  run(_params: any, _table: Table) {
    return new Identifier<Params, true> (this.name, this.as, this.cast);
  }

  static of<Params, Ran extends boolean = false>(name: string, as?: string, cast?: string) {
    return new Identifier<Params, Ran> (name, as, cast);
  }
}

export class All <Params, Ran extends boolean = false> {
  sign: string;

  constructor(sign: string) {
    this.sign = sign;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.All! (this.sign);
  }

  run(_params: Params, _table: Table) {
    return new All<Params, true> (this.sign);
  }
}

export class Variable<Params, Ran extends boolean = false> {
  value: RQLValue<Params, Ran>;
  as?: string;
  cast?: string;

  constructor(value: RQLValue<Params, Ran>, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.Variable! (this.value, this.as, this.cast);
  }

  run(params: Params, table: Table) {
    const ran: RQLValue<Params, true> = isFunction (this.value)
      ? this.value (params, table)
      : this.value;

    return new Variable<Params, true> (
      ran,
      this.as,
      this.cast
    );
  }
}

export class StringLiteral <Params, Ran extends boolean = false> {
  value: string;
  as?: string;
  cast?: string;

  constructor(value: string, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.StringLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new StringLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class NumericLiteral <Params, Ran extends boolean = false> {
  value: number;
  as?: string;
  cast?: string;

  constructor(value: number, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.NumericLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new NumericLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class BooleanLiteral <Params, Ran extends boolean = false> {
  value: boolean;
  as?: string;
  cast?: string;

  constructor(value: boolean, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.BooleanLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new BooleanLiteral<Params, true> (this.value, this.as, this.cast);
  }
}

export class NullLiteral <Params, Ran extends boolean = false> {
  value: null;
  as?: string;
  cast?: string;

  constructor(value: null, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R, Params, Ran>) {
    return pattern.NullLiteral! (this.value, this.as, this.cast);
  }

  run(_params: Params, _table: Table) {
    return new NullLiteral<Params, true> (this.value, this.as, this.cast);
  }
}