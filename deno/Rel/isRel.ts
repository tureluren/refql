import Rel from "./index.ts";

const isRel = (value: any): value is Rel =>
  value instanceof Rel;

export default isRel;