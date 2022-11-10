import { refqlType } from "../common/consts";
import { RefQLValue } from "../common/types";
import { HasMany } from "../nodes";
import Parser from "../Parser";
import RQLTag from "../RQLTag";

interface Table {
  <Params>(strings: TemplateStringsArray, ...values: RefQLValue<any>[]): RQLTag<Params>;
  name: string;
  schema?: string;
  refs: HasMany<any>[];
  compile(alias?: boolean): [string, any[]];
  equals(other: Table): boolean;
  toString(): string;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  compile, toString, equals
};

function Table(name: string, refsF?: ((name: string) => HasMany<any>)[]) {

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
  table.refs = (refsF || []).map (f => f (tableName));

  return table;
}

// ?
function compile(this: Table, alias: boolean = false) {
  return [`${this.schema ? `${this.schema}.` : ""}${this.name}${alias ? ` ${this.name}` : ""}`];
}

function toString(this: Table) {
  return `Table (${this.name}, ${this.schema})`;
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