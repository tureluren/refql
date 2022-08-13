import SqlTag from "./index.ts";
import { Values } from "../types.ts";

const sql = (strings: TemplateStringsArray, ...keys: Values) =>
  new SqlTag (strings, keys);

export default sql;