import Table from "./index.ts";

const isTable = (value: any): value is Table =>
  value instanceof Table;

export default isTable;