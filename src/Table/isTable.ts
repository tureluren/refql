import Table from ".";

const isTable = (value: any): value is Table =>
  value instanceof Table;

export default isTable;