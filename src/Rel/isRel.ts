import getType from "../more/getType";
import { Rel } from "../types";

const isRel = (value): value is Rel =>
  getType (value) === "Rel";

export default isRel;