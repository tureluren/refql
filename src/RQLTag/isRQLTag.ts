import RQLTag from ".";

const isRQLTag = <Input>(value: any): value is RQLTag<Input> =>
  value instanceof RQLTag;

export default isRQLTag;