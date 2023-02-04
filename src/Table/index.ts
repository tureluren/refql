import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Querier, RefMakerPair, RQLTagMaker, RQLTagVariable, Runnable } from "../common/types";
import validateTable from "../common/validateTable";
import { ASTNode } from "../nodes";
import RQLTag from "../RQLTag";
import Parser from "../RQLTag/Parser";

interface Table {
  name: string;
  schema?: string;
  refs: RefMakerPair[];
  equals(other: Table): boolean;
  empty<Params, Output>(): RQLTag<Params, Output> & Runnable<Params, Output>;
  toString(): string;
  run<Return>(querier: Querier): Promise<Return[]>;
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

function Table(name: string, refs: RefMakerPair[] = [], defaultQuerier?: Querier): Table & RQLTagMaker {
  validateTable (name);

  if (!Array.isArray (refs)) {
    throw new Error ("Invalid refs: not an Array");
  }

  const table = (<Params, Output>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output>[]) => {
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

export const createTableWithDefaultQuerier = (defaultQuerier: Querier) => (name: string, refs: RefMakerPair[] = []) => {
  return Table (name, refs, defaultQuerier);
};

export default Table;