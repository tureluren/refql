import Raw from ".";

const isRaw = (value: any): value is Raw =>
  value instanceof Raw;

export default isRaw;