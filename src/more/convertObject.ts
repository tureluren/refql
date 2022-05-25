import { OptCaseType } from "../types";
import convertCase from "./convertCase";

const convertObject = <T extends object>(caseType: OptCaseType, obj: T): T =>
  Object.keys (obj).reduce ((acc: any, key: string) => {
    acc[convertCase (caseType, key)] = obj[key as keyof T];
    return acc;
  }, {});

export default convertObject;