import SQLTag from ".";
import { Values } from "../types";

const sql = <Input, Output> (strings: TemplateStringsArray, ...keys: Values) =>
  new SQLTag<Input, Output> (strings, keys);

export default sql;