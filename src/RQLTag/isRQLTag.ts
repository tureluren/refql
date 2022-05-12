import getType from "../more/getType";
import { RQLTag } from "../types";

const isRQLTag = (value): value is RQLTag =>
  getType (value) === "RQLTag";

export default isRQLTag;