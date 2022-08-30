import SqlTag from ".";
import { RQLValue } from "../types";

const sql = <Params> (strings: TemplateStringsArray, ...keys: RQLValue<Params>[]) =>
  new SqlTag<Params> (strings, keys);

export default sql;