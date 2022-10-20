import { refqlType } from "../common/consts";

interface Table {
  name: string;
  as: string;
  schema?: string;
  compile(alias?: boolean): [string, any[]];
  toString(): string;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  compile, toString
};

function Table(name: string, as?: string, schema?: string) {
  let table: Table = Object.create (prototype);
  table.name = name;
  table.as = as || name;
  table.schema = schema;

  return table;
}

function compile(this: Table, alias: boolean = false) {
  return [`${this.schema ? `${this.schema}.` : ""}${this.name}${alias ? ` ${this.as}` : ""}`];
}

function toString(this: Table) {
  return `Table (${this.name}, ${this.as}, ${this.schema})`;
}

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === tableType;
};

export default Table;