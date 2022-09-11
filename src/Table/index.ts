interface Table {
  name: string;
  as: string;
  schema?: string;
  toString: () => string;
}

const prototype = {
  constructor: Table,
  toString
};

function Table(name: string, as?: string, schema?: string) {
  let table: Table = Object.create (Table.prototype);
  table.name = name;
  table.as = as || name;
  table.schema = schema;

  return table;
}

Table.prototype = Object.create (prototype);

function toString(this: Table) {
  return `Table (${this.name}, ${this.as}, ${this.schema})`;
}

Table.isTable = function (value: any): value is Table {
  return value instanceof Table;
};

export default Table;