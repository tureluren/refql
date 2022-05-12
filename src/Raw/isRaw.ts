import Raw from ".";

const isRaw = (value): value is Raw =>
  value instanceof Raw;

export default isRaw;