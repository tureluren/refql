import SQLTag from "./index.ts";
import In from "../In/index.ts";
import Insert from "../Insert/index.ts";
import Raw from "../Raw/index.ts";
import RQLTag from "../RQLTag/index.ts";
import Select from "../Select/index.ts";
import Table from "../Table/index.ts";
import Update from "../Update/index.ts";
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
        const [tableStr] = acc.toLowerCase ().endsWith ("from")
          ? value.compile (true)
          : [value.as];
        return `${acc} ${tableStr}`;
      }

      if (Raw.isRaw (value)) {
        return `${acc} ${value.value}`;
      }

      if (In.isIn (value)) {
        const [inStr, inValues] = value.compile (paramIdx + values.length);
        values.push (...inValues);
        return `${acc} ${inStr}`;
      }

      if (Select.isSelect (value)) {
        const [selectStr] = value.compile (true, false);

        return `${acc} ${selectStr}`;
      }

      if (Insert.isInsert (value)) {
        const [insertStr, insertValues] = value.compile (paramIdx + values.length);
        values.push (...insertValues);
        return `${acc} ${insertStr}`;
      }

      if (Update.isUpdate (value)) {
        const [updateStr, updateValues] = value.compile (paramIdx + values.length);
        values.push (...updateValues);
        return `${acc} ${updateStr}`;
      }

      values.push (value);

      return `${acc} $${paramIdx + values.length}`;
    }, "");
  };

  return [formatSQLString (go (tag)), values];
};

export default compileSQLTag;