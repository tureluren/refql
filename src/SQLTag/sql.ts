import SQLTag from ".";
import { RefQLValue, StringMap } from "../types";

const sql = <Params extends StringMap = {}> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  SQLTag<Params> (strings as unknown as string[], values);

export default sql;