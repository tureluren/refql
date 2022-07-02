import RQLTag from ".";

const isRQLTag = <Input, Output>(value: any): value is RQLTag<Input, Output> =>
  value instanceof RQLTag;

export default isRQLTag;