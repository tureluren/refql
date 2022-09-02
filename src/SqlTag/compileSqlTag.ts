import SqlTag from ".";
import In from "../In";
import Raw from "../Raw";
import RqlTag from "../RqlTag";
import Table from "../Table";
import formatSqlString from "./formatSqlString";

const compileSqlTag = <Params>(tag: SqlTag<Params>, paramIdx: number, params: Params, table?: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SqlTag<Params>): string => {
    return sqlTag.strings.reduce ((acc, str, idx) => {
      let value = sqlTag.values[idx];

      if (typeof value !== "undefined") {

        if (typeof value === "function") {
          value = value (params, table);
        }

        if (value instanceof RqlTag) {
          throw new Error ("You can't use Rql tags inside Sql Tags");
        }

        if (value instanceof SqlTag) {
          return `${acc} ${str} ${go (value)}`;
        }

        if (value instanceof Table) {
          return `${acc} ${str} ${value.as}`;
        }

        if (value instanceof Raw) {
          return `${acc} ${str} ${value.value}`;
        }

        if (value instanceof In) {
          const inStr = value.write (paramIdx + values.length);
          values.push (...value.arr);
          return `${acc} ${str} ${inStr}`;
        }

        values.push (value);

        return `${acc} ${str} $${paramIdx + values.length}`;
      }

      return `${acc} ${str}`;
    }, "");
  };

  return [formatSqlString (go (tag)), values];
};

export default compileSqlTag;