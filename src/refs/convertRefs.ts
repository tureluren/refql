import convertCase from "../more/convertCase";
import isObject from "../predicate/isObject";
import { ConvertRefsFn, Link, Refs, TableRefsObject } from "../types";
import convertLinks from "./convertLinks";

// refs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
// refs: { tableTo: [["tableFromCol", "tableToCol"]] }
// refs should be validated before calling this function
const convertRefs: ConvertRefsFn = (caseType, refs) => {
  const go = (obj: Refs | TableRefsObject | Link[]) => {
    const resKeys = {};
    Object.keys (obj).forEach (key => {
      const value = obj[key];
      const convertedKey = convertCase (caseType, key);

      if (isObject (value)) {
        resKeys[convertedKey] = go (value);
      } else {
        resKeys[convertedKey] = convertLinks (caseType, value);
      }
    });
    return resKeys;
  };

  return go (refs);
};

export default convertRefs;