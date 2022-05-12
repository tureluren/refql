import SQLTag from ".";
import { Values } from "../types";

const sql = (strings: TemplateStringsArray, ...keys: Values) =>
  new SQLTag (strings, keys);

export default sql;