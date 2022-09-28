import SQLTag from ".";
import { RefQLValue } from "../common/types";
import { Variable } from "../nodes";
import formatSQLString from "./formatSQLString";

const sql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  SQLTag<Params> (strings
    .map (formatSQLString)
    .map ((s, idx) =>
      values[idx] ? [s, Variable (values[idx])] : s)

    .flat (1)
    .filter (s => s !== ""));

export default sql;