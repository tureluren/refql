class Table {
  name: string;
  as: string;

  constructor(name: string, as?: string) {
    this.name = name;
    this.as = as || name;
  }
}

export default Table;