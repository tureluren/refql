import SQLTag from "./index.ts";
import { RefQLValue } from "../common/types.ts";
import { Variable } from "../nodes/index.ts";
import formatSQLString from "./formatSQLString.ts";

const sql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  SQLTag<Params> (strings
    .map (formatSQLString)
    .map ((s, idx) =>
      values[idx] ? [s, Variable (values[idx])] : s)

    .flat (1)
    .filter (s => s !== ""));

export default sql;