// @ts-nocheck
import convertCase from "../more/convertCase";
import keys from "../more/keys";
import { OptCaseType, Refs } from "../types";
import convertTableRefs from "./convertTableRefs";

// refs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
// refs should be validated before calling this function
const convertRefs = (caseType: OptCaseType, refs: Refs) => {
  const converted: Refs = {};

  keys<Refs> (refs).forEach (key => {
    const tableRefs = refs[key];
    const tableFrom = convertCase (caseType, key);

    converted[tableFrom] = convertTableRefs (caseType, tableRefs);
  });

  return converted;
};

export default convertRefs;