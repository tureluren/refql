import SQLTag from "./index.ts";
import { Values } from "../types.ts";

const sql = (strings: TemplateStringsArray, ...keys: Values) =>
  new SQLTag (strings, keys);

export default sql;