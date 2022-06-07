import convertCase from "../more/convertCase.ts";
import keys from "../more/keys.ts";
import { OptCaseType, TableRefs } from "../types.ts";
import convertLinks from "./convertLinks.ts";

// tableRefs: { tableTo: [["tableFromCol", "tableToCol"]] }
// tableRefs should be validated before calling this function
const convertTableRefs = (caseType: OptCaseType, tableRefs: TableRefs) => {
  const converted: TableRefs = {};

  keys<TableRefs> (tableRefs).forEach (key => {
    const links = tableRefs[key];
    const tableTo = convertCase (caseType, key);

    converted[tableTo] = convertLinks (caseType, links);
  });

  return converted;
};

export default convertTableRefs;