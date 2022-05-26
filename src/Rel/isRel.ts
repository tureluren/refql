import Rel from ".";

const isRel = (value: any): value is Rel =>
  value instanceof Rel;

export default isRel;