import isArray from "./isArray";
import isString from "./isString";

// linkArray: [["tableFromCol", "tableToCol"]]
const isLinkArray = arr => {
  let itIs = true;

  if (!isArray (arr)) {
    return false;
  }

  let idx = 0;

  while (itIs && idx < arr.length) {
    let link = arr[idx];

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