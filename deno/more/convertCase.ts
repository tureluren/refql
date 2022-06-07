import { OptCaseType } from "../types.ts";
import toCamel from "./toCamel.ts";
import toSnake from "./toSnake.ts";

const convertCase = (caseType: OptCaseType, str: string) => {
  if (caseType === "camel") return toCamel (str);
  if (caseType === "snake") return toSnake (str);
  return str;
};

export default convertCase;