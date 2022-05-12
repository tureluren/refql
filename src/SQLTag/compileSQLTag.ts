import SQLTag from ".";
import isArray from "../predicate/isArray";
import isFunction from "../predicate/isFunction";
import isRaw from "../Raw/isRaw";
import isRQLTag from "../RQLTag/isRQLTag";
import isTable from "../Table/isTable";
import { Values } from "../types";
import formatSQLString from "./formatSQLString";
import formatTLString from "./formatTLString";
import isSQLTag from "./isSQLTag";

const compileSQLTag = (tag: SQLTag, keyIdx: number): [string, Values] => {
  const values: Values = [];

  const go = sqlTag => {
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
          return k.reduce ((acc, _item, idx) => {
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