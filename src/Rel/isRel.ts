import Rel from ".";

const isRel = (value): value is Rel =>
  value instanceof Rel;

export default isRel;