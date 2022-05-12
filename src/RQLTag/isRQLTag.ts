import RQLTag from ".";

const isRQLTag = (value): value is RQLTag =>
  value instanceof RQLTag;

export default isRQLTag;