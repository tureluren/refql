import SQLTag from ".";
import { RefQLValue } from "../types";

const sql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  new SQLTag<Params> (strings as unknown as string[], values);

export default sql;