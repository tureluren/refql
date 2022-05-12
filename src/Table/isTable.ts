import Table from ".";

const isTable = (value): value is Table =>
  value instanceof Table;

export default isTable;