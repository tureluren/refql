import { flEmpty, flEquals, refqlType } from "../common/consts.ts";
import { Querier, Ref, RQLTagMaker, RQLTagVariable, Runnable } from "../common/types.ts";
import validateTable from "../common/validateTable.ts";
import { ASTNode } from "../nodes/index.ts";
import RQLTag from "../RQLTag/index.ts";
import Parser from "../RQLTag/Parser.ts";

interface Table {
  name: string;
  schema?: string;
  refs: Ref[];
  equals(other: Table): boolean;
  empty<Params, Output>(): RQLTag<Params, Output> & Runnable<Params, Output>;
  toString(): string;
  run<Output>(querier: Querier): Promise<Output>;
  [flEmpty]: Table["empty"];
  [flEquals]: Table["equals"];
}

const type = "refql/Table";

const prototype = Object.assign (Object.create (Function.prototype), {
  constructor: Table,
  [refqlType]: type,
  equals, [flEquals]: equals,
  empty, [flEmpty]: empty,
  toString,
  run
});

function Table(name: string, refs: Ref[] = [], defaultQuerier?: Querier): Table & RQLTagMaker {
  validateTable (name);

  if (!Array.isArray (refs)) {
    throw new Error ("Invalid refs: not an Array");
  }

  const table = (<Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output>[]) => {
    const parser = new Parser (strings.join ("$"), variables, table);

    return RQLTag<Params, Output> (table, parser.nodes () as ASTNode<Params, Output>[], defaultQuerier);
  }) as Table & RQLTagMaker;

  Object.setPrototypeOf (table, prototype);

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });

  table.schema = schema;
  table.refs = refs;

  return table;
}

function empty(this: Table & RQLTagMaker) {
  return this``;
}

function run(this: Table & RQLTagMaker, querier: Querier) {
  return this.empty () ({}, querier);
}

function toString(this: Table) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals(this: Table, other: Table) {
  if (!Table.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

Table.isTable = function (x: any): x is Table {
  return x != null && x[refqlType] === type;
};

export const createTableWithDefaultQuerier = (defaultQuerier: Querier) => (name: string, refs: Ref[] = []) => {
  return Table (name, refs, defaultQuerier);
};

export default Table;