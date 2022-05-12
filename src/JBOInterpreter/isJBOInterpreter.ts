import getType from "../more/getType";
import { JBOInterpreter } from "../types";

const isJBOInterpreter = (value): value is JBOInterpreter =>
  getType (value) === "JBOInterpreter";

export default isJBOInterpreter;