class Table {
  name: string;
  as: string;
  schema?: string;

  constructor(name: string, as?: string, schema?: string) {
    this.name = name;
    this.as = as || name;
    this.schema = schema;
  }

  toString() {
    return `Table (${this.name}, ${this.as}, ${this.schema})`;
  }

  static of(name: string, as?: string, schema?: string) {
    return new Table (name, as, schema);
  }
}

export default Table;