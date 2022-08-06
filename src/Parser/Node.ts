import Table from "../Table";
import { ASTNode, Keywords, Pattern } from "../types";

export class Root {
  table: Table;
  members: ASTNode[];
  keywords: Keywords;

  constructor(table: Table, members: ASTNode[], keywords: Keywords) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.Root (this.table, this.members, this.keywords);
  }
}

export class HasMany {
  table: Table;
  members: ASTNode[];
  keywords: Keywords;

  constructor(table: Table, members: ASTNode[], keywords: Keywords) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.HasMany (this.table, this.members, this.keywords);
  }
}

export class BelongsTo {
  table: Table;
  members: ASTNode[];
  keywords: Keywords;

  constructor(table: Table, members: ASTNode[], keywords: Keywords) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.BelongsTo (this.table, this.members, this.keywords);
  }
}

export class ManyToMany {
  table: Table;
  members: ASTNode[];
  keywords: Keywords;

  constructor(table: Table, members: ASTNode[], keywords: Keywords) {
    this.table = table;
    this.members = members;
    this.keywords = keywords;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.ManyToMany (this.table, this.members, this.keywords);
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

  cata<R>(pattern: Pattern<R>) {
    return pattern.Identifier (this.name, this.as, this.cast);
  }
}

export class Variable {
  // any ?
  value: any;
  as?: string;
  cast?: string;

  constructor(value: any, as?: string, cast?: string) {
    this.value = value;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.Variable (this.value, this.as, this.cast);
  }
}

export class Call {
  name: string;
  args: ASTNode[];
  as?: string;
  cast?: string;

  constructor(name: string, args: ASTNode[], as?: string, cast?: string) {
    this.name = name;
    this.args = args;
    this.as = as;
    this.cast = cast;
  }

  cata<R>(pattern: Pattern<R>) {
    return pattern.Call (this.name, this.args, this.as, this.cast);
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

  cata<R>(pattern: Pattern<R>) {
    return pattern.StringLiteral (this.value, this.as, this.cast);
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

  cata<R>(pattern: Pattern<R>) {
    return pattern.NumericLiteral (this.value, this.as, this.cast);
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

  cata<R>(pattern: Pattern<R>) {
    return pattern.BooleanLiteral (this.value, this.as, this.cast);
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

  cata<R>(pattern: Pattern<R>) {
    return pattern.NullLiteral (this.value, this.as, this.cast);
  }
}