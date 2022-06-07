import { TableRefs } from "../types.ts";
import isLinkArray from "./isLinkArray.ts";
import isObject from "./isObject.ts";

// tableRefs: { tableTo: [["tableFromCol", "tableToCol"]] }
const areTableRefs = (value: any): value is TableRefs => {
  let itIs = true;

  if (!isObject (value)) {
    return false;
  }

  let idx = 0;
  const keys = Object.keys (value);

  while (itIs && idx < keys.length) {
    const linkArray = value[keys[idx]];

    if (itIs) {
      itIs = isLinkArray (linkArray);
    }

    idx += 1;
  }

  return itIs;
};

export default areTableRefs;