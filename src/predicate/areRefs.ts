import keys from "../more/keys";
import { RefsOld } from "../types";
import areTableRefs from "./areTableRefs";
import isObject from "./isObject";

// refs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
const areRefs = (value: any): value is RefsOld => {
  if (!isObject (value)) {
    return false;
  }

  let theyAre = true;

  keys<RefsOld> (value).forEach (tableFrom => {
    const tableRefs = value[tableFrom];
    theyAre = areTableRefs (tableRefs);
  });

  return theyAre;
};

export default areRefs;