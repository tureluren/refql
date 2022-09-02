import SqlTag from ".";
import { RQLValue } from "../types";

const sql = <Params> (strings: TemplateStringsArray, ...values: RQLValue<Params>[]) =>
  new SqlTag<Params> (strings as unknown as string[], values);

export default sql;