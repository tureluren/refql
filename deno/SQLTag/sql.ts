import SQLTag from "./index.ts";
import { RefQLValue } from "../types.ts";

const sql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) =>
  new SQLTag<Params> (strings as unknown as string[], values);

export default sql;