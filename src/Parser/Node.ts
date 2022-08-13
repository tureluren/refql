import Table from "../Table";
import { ASTNode, Keywords, Pattern, RQLValue } from "../types";

export class MembersNode {
  members: ASTNode[];

  constructor(members: ASTNode[]) {
    this.members = members;
  }
}

export class Root extends MembersNode {
  table: Table;
  keywords: Keywords<any>;

  constructor(table: Table, members: ASTNode[], keywords: Keywords<any>) {
    super (members);
    this.table = table;
    this.keywords = keywords;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.Root! (this.table, this.members, this.keywords);
  }
}

export class HasMany extends MembersNode {
  table: Table;
  keywords: Keywords<any>;

  constructor(table: Table, members: ASTNode[], keywords: Keywords<any>) {
    super (members);
    this.table = table;
    this.keywords = keywords;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.HasMany! (this.table, this.members, this.keywords);
  }
}

export class BelongsTo extends MembersNode {
  table: Table;
  keywords: Keywords<any>;

  constructor(table: Table, members: ASTNode[], keywords: Keywords<any>) {
    super (members);
    this.table = table;
    this.keywords = keywords;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.BelongsTo! (this.table, this.members, this.keywords);
  }
}

export class ManyToMany extends MembersNode {
  table: Table;
  keywords: Keywords<any>;

  constructor(table: Table, members: ASTNode[], keywords: Keywords<any>) {
    super (members);
    this.table = table;
    this.keywords = keywords;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.ManyToMany! (this.table, this.members, this.keywords);
  }
}

export class Call extends MembersNode {
  name: string;
  as?: string;
  cast?: string;

  constructor(name: string, args: ASTNode[], as?: string, cast?: string) {
    super (args);
    this.name = name;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.Call! (this.name, this.members, this.as, this.cast);
  }
}

export class Identifier {
  name: string;
  as?: string;
  cast?: string;

  constructor(name: string, as?: string, cast?: string) {
    this.name = name;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.Identifier! (this.name, this.as, this.cast);
  }
}

export class Variable {
  value: RQLValue<any>;
  as?: string;
  cast?: string;

  constructor(value: RQLValue<any>, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.Variable! (this.value, this.as, this.cast);
  }
}

export class StringLiteral {
  value: string;
  as?: string;
  cast?: string;

  constructor(value: string, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.StringLiteral! (this.value, this.as, this.cast);
  }
}

export class NumericLiteral {
  value: number;
  as?: string;
  cast?: string;

  constructor(value: number, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.NumericLiteral! (this.value, this.as, this.cast);
  }
}

export class BooleanLiteral {
  value: boolean;
  as?: string;
  cast?: string;

  constructor(value: boolean, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.BooleanLiteral! (this.value, this.as, this.cast);
  }
}

export class NullLiteral {
  value: null;
  as?: string;
  cast?: string;

  constructor(value: null, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.NullLiteral! (this.value, this.as, this.cast);
  }
}