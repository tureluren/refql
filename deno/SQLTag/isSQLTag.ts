import SqlTag from "./index.ts";

const isSqlTag = (value: any): value is SqlTag =>
  value instanceof SqlTag;

export default isSqlTag;