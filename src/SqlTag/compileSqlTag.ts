import SqlTag from ".";
import parameterize from "../more/parameterize";
import isArray from "../predicate/isArray";
import isFunction from "../predicate/isFunction";
import isRaw from "../Raw/isRaw";
import isRqlTag from "../RqlTag/isRqlTag";
import Table from "../Table";
import isTable from "../Table/isTable";
import { Values } from "../types";
import formatSqlString from "./formatSqlString";
import formatTlString from "./formatTlString";
import isSqlTag from "./isSqlTag";

const compileSqlTag = <Input>(tag: SqlTag<Input>, keyIdx: number, params: Input, table: Table): [string, Values] => {
  const values: Values = [];

  const go = (sqlTag: SqlTag<Input>): string => {
    const { strings, keys } = sqlTag;

    return strings.reduce ((acc, str, idx) => {

      const s = formatTlString (str);

      const k = keys[idx];

      if (typeof k !== "undefined") {

        if (isFunction (k)) {
          // raw res opvangen
          const res = k (params, table);
          values.push (res);
          return acc + s + " $" + (keyIdx + values.length) + " ";
        }

        if (isRqlTag (k)) {
          throw new Error ("You can't use RQL tags inside SQL Tags");
        }

        if (isSqlTag<Input> (k)) {
          return acc + s + " " + go (k);
        }

        if (isTable (k)) {
          // @ts-ignore
          return acc + s + " " + k.as;
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

      return `${acc} ${s}`;
    }, "");
  };

  return [formatSqlString (go (tag)), values];
};

export default compileSqlTag;