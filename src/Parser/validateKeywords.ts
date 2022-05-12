import isLinkArray from "../predicate/isLinkArray";
import isNumber from "../predicate/isNumber";
import isString from "../predicate/isString";
import isTableRefsObject from "../predicate/isTableRefsObject";
import { Keywords } from "../types";

const validateKeywords = keywords => {
  const { as, links, refs, xTable, id, limit, offset } = <Keywords>keywords;

  if (as != null && !isString (as)) {
    throw new TypeError (
      "`as` should be of type String"
    );
  }

  if (links != null && !isLinkArray (links)) {
    throw new TypeError (
      '`links` should be of type [["tableFromCol", "tableToCol"]]'
    );
  }

  if (refs != null && !isTableRefsObject (refs)) {
    throw new TypeError (
      '`refs` should be of type { table1: [["xTableFromCol", "table1ToCol"]], table2: [["xTableFromCol", "table2ToCol"]] }'
    );
  }

  if (xTable != null && !isString (xTable)) {
    throw new TypeError (
      "`xTable` should be of type String"
    );
  }

  if (id != null && !(isString (id) || isNumber (id))) {
    throw new TypeError (
      "`id` should be of type String or Number"
    );
  }

  if (limit != null && !isNumber (limit)) {
    throw new TypeError (
      "`limit` should be of type Number"
    );
  }

  if (offset != null && !isNumber (offset)) {
    throw new TypeError (
      "`offset` should be of type Number"
    );
  }

  return true;
};

export default validateKeywords;