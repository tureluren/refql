import getType from "../more/getType";
import { Sub } from "../types";

const isSub = (value): value is Sub =>
  getType (value) === "Sub";

export default isSub;