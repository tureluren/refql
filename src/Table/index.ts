class Table {
  name: string;
  as?: string;

  constructor(name: string, as?: string) {
    this.name = name;
    this.as = as;
  }

  [Symbol.toPrimitive](hint: string) {
    if (hint == "string" || hint == "default") {
      return this.as || this.name;
    }
  }
}

export default Table;