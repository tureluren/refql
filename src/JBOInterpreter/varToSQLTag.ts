import isFunction from "../predicate/isFunction";
import isRQLTag from "../RQLTag/isRQLTag";
import SQLTag from "../SQLTag";
import isSQLTag from "../SQLTag/isSQLTag";

const varToSQLTag = (value, table): SQLTag | null => {
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