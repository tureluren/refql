import SQLTag from "./index.ts";
import isArray from "../predicate/isArray.ts";
import isFunction from "../predicate/isFunction.ts";
import isRaw from "../Raw/isRaw.ts";
import isRQLTag from "../RQLTag/isRQLTag.ts";
import isTable from "../Table/isTable.ts";
import { Values } from "../types.ts";
import formatSQLString from "./formatSQLString.ts";
import formatTLString from "./formatTLString.ts";
import isSQLTag from "./isSQLTag.ts";

const compileSQLTag = (tag: SQLTag, keyIdx: number): [string, Values] => {
  const values: Values = [];

  const go = (sqlTag: SQLTag): string => {
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
          return acc + s + ' "' + k.as + '"';
        }

        if (isRaw (k)) {
          return acc + s + " " + k.value + " ";
        }

        if (isArray (k)) {
          values.push (...k);
          return k.reduce ((acc: string, _item: any, idx: number) => {
            const pre = idx === 0 ? "" : ",";
            return acc + pre + "$" + (keyIdx + idx + 1);
          }, acc + s);
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