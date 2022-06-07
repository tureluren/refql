import { Dict, OptCaseType } from "../types.ts";
import convertCase from "./convertCase.ts";

const convertObject = (caseType: OptCaseType, obj: Dict): Dict =>
  Object.keys (obj).reduce ((acc: Dict, key: string) => {
    acc[convertCase (caseType, key)] = obj[key];
    return acc;
  }, {});

export default convertObject;