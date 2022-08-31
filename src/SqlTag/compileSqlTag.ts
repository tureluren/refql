import SqlTag from ".";
import In from "../In";
import Raw from "../Raw";
import RqlTag from "../RqlTag";
import Table from "../Table";
import formatSqlString from "./formatSqlString";
import formatTlString from "./formatTlString";

const compileSqlTag = <Params>(tag: SqlTag<Params>, paramIdx: number, params: Params, table: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SqlTag<Params>): string => {
    const { strings, keys } = sqlTag;

    return strings.reduce ((acc, str, idx) => {
      const s = formatTlString (str);
      let k = keys[idx];

      if (typeof k !== "undefined") {

        if (typeof k === "function") {
          k = k (params, table);
        }

        if (k instanceof RqlTag) {
          throw new Error ("You can't use Rql tags inside Sql Tags");
        }

        if (k instanceof SqlTag) {
          return `${acc + s} ${go (k)}`;
        }

        if (k instanceof Table) {
          return `${acc + s} ${k.as}`;
        }

        if (k instanceof Raw) {
          return `${acc + s} ${k.value} `;
        }

        if (k instanceof In) {
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