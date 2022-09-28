import SQLTag from "./index.ts";
import In from "../In/index.ts";
import Raw from "../Raw/index.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";
import formatSQLString from "./formatSQLString.ts";

const compileSQLTag = <Params>(tag: SQLTag<Params>, paramIdx: number, params: Params, table?: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SQLTag<Params>): string => {
    return sqlTag.values.reduce ((acc: string, strOrVar) => {
      if (typeof strOrVar === "string") {
        return `${acc} ${strOrVar}`;
      }

      let value = strOrVar.value;

      if (typeof value === "function") {
        value = value (params, table);
      }

      if (RQLTag.isRQLTag<Params> (value)) {
        throw new Error ("You can't use RQL Tags inside SQL Tags");
      }

      if (SQLTag.isSQLTag<Params> (value)) {
        return `${acc} ${go (value)}`;
      }

      if (Table.isTable (value)) {
        return acc.toLowerCase ().endsWith ("from")
          ? `${acc} ${value.write ()}`
          : `${acc} ${value.as}`;
      }

      if (Raw.isRaw (value)) {
        return `${acc} ${value.value}`;
      }

      if (In.isIn (value)) {
        const inStr = value.write (paramIdx + values.length);
        values.push (...value.arr);
        return `${acc} ${inStr}`;
      }

      values.push (value);

      return `${acc} $${paramIdx + values.length}`;

    }, "");
  };

  return [formatSQLString (go (tag)), values];
};

export default compileSQLTag;