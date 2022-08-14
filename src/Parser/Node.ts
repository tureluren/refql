import runKeyword from "../Interpreter/runKeyword";
import Table from "../Table";
import { ASTNode, Keywords, Pattern, RQLValue, TableNode, TableNodeCTor } from "../types";

function runKeywordsOnTableNode <Params>(this: TableNode, params: Params): TableNode {
  const runKw = runKeyword (params, this.table);
  const name = runKw (this.keywords.name) || this.table.name;
  const as = runKw (this.keywords.as) || this.table.as;
  const schema = runKw (this.keywords.schema) || this.table.schema;

  return new (this.constructor as TableNodeCTor) (
    new Table (name, as, schema),
    this.members,
    this.keywords
  );
}

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

  runKeywords<Params>(params: Params, _table: Table): Root {
    return runKeywordsOnTableNode.bind (this) (params);
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

  runKeywords<Params>(params: Params, _table: Table): HasMany {
    return runKeywordsOnTableNode.bind (this) (params);
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

  runKeywords<Params>(params: Params, _table: Table): BelongsTo {
    return runKeywordsOnTableNode.bind (this) (params);
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

  runKeywords<Params>(params: Params, _table: Table): ManyToMany {
    return runKeywordsOnTableNode.bind (this) (params);
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
  }
}

export class All {
  sign: string;

  constructor(sign: string) {
    this.sign = sign;
  }

  cata<P, R>(pattern: Pattern<P, R>) {
    return pattern.All! (this.sign);
  }

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
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

  runKeywords<Params>(params: Params, table: Table) {
    return new Variable (
      runKeyword (params, table) (this.value),
      this.as,
      this.cast
    );
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
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

  runKeywords<Params>(_params: Params, _table: Table) {
    return this;
  }
}