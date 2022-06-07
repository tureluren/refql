import isFunction from "../predicate/isFunction.ts";
import isRQLTag from "../RQLTag/isRQLTag.ts";
import SQLTag from "../SQLTag/index.ts";
import isSQLTag from "../SQLTag/isSQLTag.ts";
import Table from "../Table/index.ts";

const varToSQLTag = (value: any, table: Table): SQLTag | null => {
  if (isSQLTag (value)) {
    return value;
  }

  if (isRQLTag (value)) {
    throw new Error ("You can't nest RQL tags");
  }

  if (isFunction (value)) {
    // @ts-ignore
    const sqlTag = value (table);

    if (isSQLTag (sqlTag)) {
      return sqlTag;
    }

    throw new Error ("Only functions that return a sql snippet are allowed");
  }

  return null;
};

export default varToSQLTag;