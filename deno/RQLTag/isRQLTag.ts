import RQLTag from "./index.ts";

const isRQLTag = (value: any): value is RQLTag =>
  value instanceof RQLTag;

export default isRQLTag;