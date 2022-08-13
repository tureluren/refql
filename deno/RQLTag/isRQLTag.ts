import RqlTag from "./index.ts";

const isRqlTag = (value: any): value is RqlTag =>
  value instanceof RqlTag;

export default isRqlTag;