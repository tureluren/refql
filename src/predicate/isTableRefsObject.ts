import isLinkArray from "./isLinkArray";
import isObject from "./isObject";

// tableRefsObject: { tableTo: [["tableFromCol", "tableToCol"]] }
const isTableRefsObject = refObj => {
  let itIs = true;

  if (!isObject (refObj)) {
    return false;
  }

  let idx = 0;
  const keys = Object.keys (refObj);

  while (itIs && idx < keys.length) {
    const linkArray = refObj[keys[idx]];

    if (itIs) {
      itIs = isLinkArray (linkArray);
    }

    idx += 1;
  }

  return itIs;
};

export default isTableRefsObject;