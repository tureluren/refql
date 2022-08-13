// DELETE

import isFunction from "../predicate/isFunction";
import isRqlTag from "../RqlTag/isRqlTag";
import SqlTag from "../SqlTag";
import isSqlTag from "../SqlTag/isSqlTag";
import Table from "../Table";

const varToSQLTag = <Input>(value: any, table: Table): SqlTag<Input> | null => {
  if (isSqlTag<Input> (value)) {
    return value;
  }

  if (isRqlTag (value)) {
    throw new Error ("You can't nest RQL tags");
  }

  if (isFunction (value)) {
    // @ts-ignore
    const sqlTag = value (table);

    if (isSqlTag<Input> (sqlTag)) {
      return sqlTag;
    }

    throw new Error ("Only functions that return a sql snippet are allowed");
  }

  return null;
};

export default varToSQLTag;