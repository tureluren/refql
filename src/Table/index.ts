class Table {
  name: string;
  as: string;
  schema?: string;

  constructor(name: string, as?: string, schema?: string) {
    this.name = name;
    this.as = as || name;
    this.schema = schema;
  }
}

export default Table;