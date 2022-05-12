import { OptCaseType } from "../types";
import convertCase from "./convertCase";

const convertObject = <T>(caseType: OptCaseType, obj: T): T =>
  Object.keys (obj).reduce ((acc, key) => {
    acc[convertCase (caseType, key)] = obj[key];
    return acc;
  }, <T>{});

export default convertObject;