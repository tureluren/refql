import convertCase from "../more/convertCase";
import keys from "../more/keys";
import { CaseType, TableRefs } from "../types";
import convertLinks from "./convertLinks";

// tableRefs: { tableTo: [["tableFromCol", "tableToCol"]] }
// tableRefs should be validated before calling this function
const convertTableRefs = (caseType: CaseType, tableRefs: TableRefs) => {
  const converted: TableRefs = {};

  keys<TableRefs> (tableRefs).forEach (key => {
    const links = tableRefs[key];
    const tableTo = convertCase (caseType, key);

    converted[tableTo] = convertLinks (caseType, links);
  });

  return converted;
};

export default convertTableRefs;