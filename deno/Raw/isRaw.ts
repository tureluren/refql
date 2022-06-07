import Raw from "./index.ts";

const isRaw = (value: any): value is Raw =>
  value instanceof Raw;

export default isRaw;