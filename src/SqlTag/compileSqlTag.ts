import SqlTag from ".";
import isIn from "../In/isIn";
import isFunction from "../predicate/isFunction";
import isRaw from "../Raw/isRaw";
import isRqlTag from "../RqlTag/isRqlTag";
import Table from "../Table";
import isTable from "../Table/isTable";
import formatSqlString from "./formatSqlString";
import formatTlString from "./formatTlString";
import isSqlTag from "./isSqlTag";

const compileSqlTag = <Params>(tag: SqlTag<Params>, paramIdx: number, params: Params, table: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SqlTag<Params>): string => {
    const { strings, keys } = sqlTag;

    return strings.reduce ((acc, str, idx) => {

      const s = formatTlString (str);

      let k = keys[idx];

      if (typeof k !== "undefined") {

        if (isFunction (k)) {
          k = k (params, table);
        }

        if (isRqlTag (k)) {
          throw new Error ("You can't use RQL tags inside SQL Tags");
        }

        if (isSqlTag (k)) {
          return `${acc + s} ${go (k)}`;
        }

        if (isTable (k)) {
          return `${acc + s} ${k.as}`;
        }

        if (isRaw (k)) {
          return `${acc + s} ${k.value} `;
        }

        if (isIn (k)) {
          values.push (...k.arr);
          return `${acc + s} ${k.write (paramIdx)} `;
        }

        values.push (k);

        return `${acc + s} $${paramIdx + values.length} `;
      }

      return `${acc} ${s}`;
    }, "");
  };

  return [formatSqlString (go (tag)), values];
};

export default compileSqlTag;