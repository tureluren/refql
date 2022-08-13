import SqlTag from ".";
import { RQLValue, Values } from "../types";

const sql = <Input> (strings: TemplateStringsArray, ...keys: RQLValue<Input>[]) =>
  new SqlTag<Input> (strings, keys);

export default sql;