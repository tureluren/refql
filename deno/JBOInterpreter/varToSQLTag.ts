import isFunction from "../predicate/isFunction.ts";
import isRqlTag from "../RqlTag/isRqlTag.ts";
import SqlTag from "../SqlTag/index.ts";
import isSqlTag from "../SqlTag/isSqlTag.ts";
import Table from "../Table/index.ts";

const varToSQLTag = (value: any, table: Table): SqlTag | null => {
  if (isSqlTag (value)) {
    return value;
  }

  if (isRqlTag (value)) {
    throw new Error ("You can't nest RQL tags");
  }

  if (isFunction (value)) {
    // @ts-ignore
    const sqlTag = value (table);

    if (isSqlTag (sqlTag)) {
      return sqlTag;
    }

    throw new Error ("Only functions that return a sql snippet are allowed");
  }

  return null;
};

export default varToSQLTag;