import getType from "../more/getType";
import { Environment } from "../types";

const isEnvironment = (value): value is Environment =>
  getType (value) === "Environment";

export default isEnvironment;
