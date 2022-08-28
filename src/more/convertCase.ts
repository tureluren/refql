import { CaseType } from "../types";
import toCamel from "./toCamel";
import toSnake from "./toSnake";

const convertCase = (caseType: CaseType, str: string) => {
  if (caseType === "camel") return toCamel (str);
  if (caseType === "snake") return toSnake (str);
  return str;
};

export default convertCase;