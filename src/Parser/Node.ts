import runKeyword from "../Interpreter/runKeyword";
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
    const runKw = runKeyword (params, this.table);

    const patched: Keywords<Params, true> = (Object.keys (this.keywords) as Array<keyof Keywords<Params, false>>).reduce ((acc, key) => {
      acc[key] = runKw (this.keywords[key]);
      return acc;
    }, {} as { [key: string]: any });

    return new Root<Params, true> (
      this.table,
      this.members,
      patched
    );
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
    const runKw = runKeyword (params, this.table);
    const patched: Keywords<Params, true> = (Object.keys (this.keywords) as Array<keyof Keywords<Params, false>>).reduce ((acc, key) => {
      acc[key] = runKw (this.keywords[key]);
      return acc;
    }, {} as { [key: string]: any });

    return new HasMany<Params, true> (
      this.table,
      this.members,
      patched
    );
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
    const runKw = runKeyword (params, this.table);
    const patched: Keywords<Params, true> = (Object.keys (this.keywords) as Array<keyof Keywords<Params, false>>).reduce ((acc, key) => {
      acc[key] = runKw (this.keywords[key]);
      return acc;
    }, {} as { [key: string]: any });

    return new BelongsTo<Params, true> (
      this.table,
      this.members,
      patched
    );
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
    const runKw = runKeyword (params, this.table);
    const patched: Keywords<Params, true> = (Object.keys (this.keywords) as Array<keyof Keywords<Params, false>>).reduce ((acc, key) => {
      acc[key] = runKw (this.keywords[key]);
      return acc;
    }, {} as { [key: string]: any });

    return new ManyToMany<Params, true> (
      this.table,
      this.members,
      patched
    );
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

const runVariable = <Input>(params: Input, table: Table) =>
  (keyword: ((params: Input, table: Table) => RQLValue<Input, true>) | RQLValue<Input, false>) => {
    if (isFunction (keyword)) {
      return keyword (params, table);
    }
    return keyword;
  };

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
    const kw = runVariable (params, table) (this.value);
    return new Variable<Params, true> (
      kw,
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

  run(_params: any, _table: Table) {
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