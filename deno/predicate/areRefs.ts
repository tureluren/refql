import keys from "../more/keys.ts";
import { Refs } from "../types.ts";
import areTableRefs from "./areTableRefs.ts";
import isObject from "./isObject.ts";

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