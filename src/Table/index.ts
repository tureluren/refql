import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Querier, RefQLValue, StringMap, TableRefMakerPair } from "../common/types";
import { astNodePrototype } from "../nodes/ASTNode";
import Parser from "../Parser";
import RQLTag from "../RQLTag";

interface Table {
  <Params, Output>(strings: TemplateStringsArray, ...values: any[]): RQLTag<Params, Output>;
  name: string;
  schema?: string;
  refs: TableRefMakerPair[];
  equals(other: Table): boolean;
  empty(): RQLTag<unknown, unknown>;
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

function Table(name: string, refs?: any[]) {

  const table = (<Params, Output>(strings: TemplateStringsArray, ...values: any[]) => {
    const parser = new Parser (strings.join ("$"), values, table);

    return RQLTag<Params, Output> (table, parser.members ());
  }) as Table;

  Object.setPrototypeOf (table, prototype);

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });

  table.schema = schema;
  table.refs = refs || [];

  return table;
}

function empty(this: Table) {
  return this``;
}

function run(this: Table, querier: Querier) {
  return this.empty ().run (querier);
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

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === type;
};

export default Table;