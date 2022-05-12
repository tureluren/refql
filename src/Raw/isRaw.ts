import Raw from ".";
import getType from "../more/getType";

const isRaw = (value): value is Raw =>
  getType (value) === "Raw";

export default isRaw;