import SQLTag from ".";
import { Values } from "../types";

const sql = <Input> (strings: TemplateStringsArray, ...keys: Values) =>
  new SQLTag<Input> (strings, keys);

export default sql;