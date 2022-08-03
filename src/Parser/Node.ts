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