import { refqlType } from "../consts";

interface Table {
  name: string;
  as: string;
  schema?: string;
  toString: () => string;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  toString
};

function Table(name: string, as?: string, schema?: string) {
  let table: Table = Object.create (prototype);
  table.name = name;
  table.as = as || name;
  table.schema = schema;

  return table;
}

function toString(this: Table) {
  return `Table (${this.name}, ${this.as}, ${this.schema})`;
}

Table.isTable = function (value: any): value is Table {
  return value[refqlType] === tableType;
};

export default Table;