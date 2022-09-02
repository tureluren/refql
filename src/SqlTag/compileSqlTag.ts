import SqlTag from ".";
import In from "../In";
import Raw from "../Raw";
import RqlTag from "../RqlTag";
import Table from "../Table";
import formatSqlString from "./formatSqlString";
import formatTlString from "./formatTlString";

const compileSqlTag = <Params>(tag: SqlTag<Params>, paramIdx: number, params: Params, table?: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SqlTag<Params>): string => {
    return sqlTag.strings.reduce ((acc, str, idx) => {
      const s = formatTlString (str);
      let value = sqlTag.values[idx];

      if (typeof value !== "undefined") {

        if (typeof value === "function") {
          value = value (params, table);
        }

        if (value instanceof RqlTag) {
          throw new Error ("You can't use Rql tags inside Sql Tags");
        }

        if (value instanceof SqlTag) {
          return `${acc + s} ${go (value)}`;
        }

        if (value instanceof Table) {
          return `${acc + s} ${value.as}`;
        }

        if (value instanceof Raw) {
          return `${acc + s} ${value.value} `;
        }

        if (value instanceof In) {
          values.push (...value.arr);
          return `${acc + s} ${value.write (paramIdx)} `;
        }

        values.push (value);

        return `${acc + s} $${paramIdx + values.length} `;
      }

      return `${acc} ${s}`;
    }, "");
  };

  return [formatSqlString (go (tag)), values];
};

export default compileSqlTag;