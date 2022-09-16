import SQLTag from ".";
import { RefQLValue } from "../common/types";

const sql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  SQLTag<Params> (strings as unknown as string[], values);

export default sql;