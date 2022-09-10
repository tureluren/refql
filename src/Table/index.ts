// class Table {
//   name: string;
//   as: string;
//   schema?: string;

//   constructor(name: string, as?: string, schema?: string) {
//     this.name = name;
//     this.as = as || name;
//     this.schema = schema;
//   }

//   toString() {
//     return `Table (${this.name}, ${this.as}, ${this.schema})`;
//   }

//   static of(name: string, as?: string, schema?: string) {
//     return new Table (name, as, schema);
//   }
// }

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
  return value.constructor == Table;
};

export default Table;