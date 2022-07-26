// DELETE

import isFunction from "../predicate/isFunction";
import isRQLTag from "../RQLTag/isRQLTag";
import SQLTag from "../SQLTag";
import isSQLTag from "../SQLTag/isSQLTag";
import Table from "../Table";

const varToSQLTag = <Input>(value: any, table: Table): SQLTag<Input> | null => {
  if (isSQLTag<Input> (value)) {
    return value;
  }

  if (isRQLTag (value)) {
    throw new Error ("You can't nest RQL tags");
  }

  if (isFunction (value)) {
    // @ts-ignore
    const sqlTag = value (table);

    if (isSQLTag<Input> (sqlTag)) {
      return sqlTag;
    }

    throw new Error ("Only functions that return a sql snippet are allowed");
  }

  return null;
};

export default varToSQLTag;