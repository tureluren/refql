import SqlTag from ".";

const isSqlTag = <Params>(value: any): value is SqlTag<Params> =>
  value instanceof SqlTag;

export default isSqlTag;