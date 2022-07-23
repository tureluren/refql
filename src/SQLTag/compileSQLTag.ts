import SQLTag from ".";
import parameterize from "../more/parameterize";
import isArray from "../predicate/isArray";
import isFunction from "../predicate/isFunction";
import isRaw from "../Raw/isRaw";
import isRQLTag from "../RQLTag/isRQLTag";
import isTable from "../Table/isTable";
import { Values } from "../types";
import formatSQLString from "./formatSQLString";
import formatTLString from "./formatTLString";
import isSQLTag from "./isSQLTag";

const compileSQLTag = <Input, Output>(tag: SQLTag<Input, Output>, keyIdx: number): [string, Values] => {
  const values: Values = [];

  const go = (sqlTag: SQLTag<Input, Output>): string => {
    const { strings, keys } = sqlTag;

    return strings.reduce ((acc, str, idx) => {

      const s = formatTLString (str);

      const k = keys[idx];

      if (typeof k !== "undefined") {

        if (isFunction (k)) {
          throw new Error ("You can't use Functions inside SQL Tags");
        }

        if (isRQLTag (k)) {
          throw new Error ("You can't use RQL tags inside SQL Tags");
        }

        if (isSQLTag (k)) {
          return acc + s + " " + go (k);
        }

        if (isTable (k)) {
          // @ts-ignore
          return acc + s + ' "' + k.as + '"';
        }

        if (isRaw (k)) {
          // @ts-ignore
          return acc + s + " " + k.value + " ";
        }

        if (isArray (k)) {
          // @ts-ignore
          values.push (...k);
          // @ts-ignore
          return parameterize (keyIdx, k.length, acc + s);
        }

        values.push (k);

        return acc + s + " $" + (keyIdx + values.length) + " ";
      }

      return acc + s;
    }, "");
  };

  return [formatSQLString (go (tag)), values];
};

export default compileSQLTag;