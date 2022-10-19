import SQLTag from ".";
import In from "../In";
import Raw from "../Raw";
import RQLTag from "../RQLTag";
import Select from "../Select";
import Table from "../Table";
import formatSQLString from "./formatSQLString";

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
          ? value.compile ()
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

      values.push (value);

      return `${acc} $${paramIdx + values.length}`;
    }, "");
  };

  return [formatSQLString (go (tag)), values];
};

export default compileSQLTag;