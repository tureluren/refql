import SqlTag from ".";

const isSqlTag = <Input>(value: any): value is SqlTag<Input> =>
  value instanceof SqlTag;

export default isSqlTag;