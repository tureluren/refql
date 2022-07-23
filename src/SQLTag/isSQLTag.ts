import SQLTag from ".";

const isSQLTag = <Input, Output>(value: any): value is SQLTag<Input, Output> =>
  value instanceof SQLTag;

export default isSQLTag;