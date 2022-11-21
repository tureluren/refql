import { refqlType } from "../common/consts";
import { Querier, RefQLValue, StringMap, TableRefMakerPair } from "../common/types";
import Parser from "../Parser";
import RQLTag from "../RQLTag";

interface Table {
  <Params>(strings: TemplateStringsArray, ...values: RefQLValue<any>[]): RQLTag<Params>;
  name: string;
  schema?: string;
  refs: TableRefMakerPair[];
  compile(): [string, any[]];
  equals(other: Table): boolean;
  empty(): RQLTag<unknown>;
  toString(): string;
  run<Return>(querier: Querier<Return>): Promise<Return[]>;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  equals,
  empty,
  // ??
  compile,
  toString,
  run
};

function Table(name: string, refs?: any[]) {

  const table = (<Params>(strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
    const parser = new Parser (strings.join ("$"), values, table);

    return RQLTag<Params> (parser.Root ());
  }) as Table;

  Object.setPrototypeOf (
    table,
    Object.assign (Object.create (Function.prototype), prototype)
  );

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

function run(this: Table, querier: Querier<StringMap>) {
  return this.empty ().run (querier);
}
//?
function compile(this: Table) {
  return [`${this.schema ? `${this.schema}.` : ""}${this.name}`];
}

function toString(this: Table) {
  return this.schema
    ? `Table (${this.name}, ${this.schema})`
    : `Table (${this.name})`;
}

function equals(this: Table, other: Table) {
  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === tableType;
};

export default Table;