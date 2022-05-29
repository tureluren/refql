import keys from "../more/keys";
import { Refs } from "../types";
import areTableRefs from "./areTableRefs";
import isObject from "./isObject";

// refs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
const areRefs = (value: any): value is Refs => {
  if (!isObject (value)) {
    return false;
  }

  let theyAre = true;

  keys<Refs> (value).forEach (tableFrom => {
    const tableRefs = value[tableFrom];
    theyAre = areTableRefs (tableRefs);
  });

  return theyAre;
};

export default areRefs;