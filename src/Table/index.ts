import { refqlType } from "../common/consts";

interface Table {
  name: string;
  as: string;
  schema?: string;
  write(): string;
  toString(): string;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  write, toString
};

function Table(name: string, as?: string, schema?: string) {
  let table: Table = Object.create (prototype);
  table.name = name;
  table.as = as || name;
  table.schema = schema;

  return table;
}

function write(this: Table) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name} ${this.as}`;
}

function toString(this: Table) {
  return `Table (${this.name}, ${this.as}, ${this.schema})`;
}

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === tableType;
};

export default Table;