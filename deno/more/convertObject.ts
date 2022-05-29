import { Dict, OptCaseType } from "../types";
import convertCase from "./convertCase";

const convertObject = (caseType: OptCaseType, obj: Dict): Dict =>
  Object.keys (obj).reduce ((acc: Dict, key: string) => {
    acc[convertCase (caseType, key)] = obj[key];
    return acc;
  }, {});

export default convertObject;