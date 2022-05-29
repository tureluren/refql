import { Link } from "../types";
import isArray from "./isArray";
import isString from "./isString";

// value: [["tableFromCol", "tableToCol"]]
const isLinkArray = (value: any): value is Link[] => {
  let itIs = true;

  if (!isArray (value)) {
    return false;
  }

  let idx = 0;

  while (itIs && idx < value.length) {
    let link = value[idx];

    if (!isArray (link)) {
      itIs = false;
    } else if (link.length !== 2) {
      itIs = false;
    } else if (!isString (link[0]) || !isString (link[1])
    ) {
      itIs = false;
    }

    idx += 1;
  }

  return itIs;
};

export default isLinkArray;