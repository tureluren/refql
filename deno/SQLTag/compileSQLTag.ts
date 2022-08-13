import SqlTag from "./index.ts";
import isArray from "../predicate/isArray.ts";
import isFunction from "../predicate/isFunction.ts";
import isRaw from "../Raw/isRaw.ts";
import isRqlTag from "../RqlTag/isRqlTag.ts";
import isTable from "../Table/isTable.ts";
import { Values } from "../types.ts";
import formatSqlString from "./formatSqlString.ts";
import formatTlString from "./formatTlString.ts";
import isSqlTag from "./isSqlTag.ts";

const compileSqlTag = (tag: SqlTag, keyIdx: number): [string, Values] => {
  const values: Values = [];

  const go = (sqlTag: SqlTag): string => {
    const { strings, keys } = sqlTag;

    return strings.reduce ((acc, str, idx) => {

      const s = formatTlString (str);

      const k = keys[idx];

      if (typeof k !== "undefined") {

        if (isFunction (k)) {
          throw new Error ("You can't use Functions inside SQL Tags");
        }

        if (isRqlTag (k)) {
          throw new Error ("You can't use RQL tags inside SQL Tags");
        }

        if (isSqlTag (k)) {
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

  return [formatSqlString (go (tag)), values];
};

export default compileSqlTag;