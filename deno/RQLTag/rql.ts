import RqlTag from "./index.ts";
import { RQLValue } from "../types.ts";

const rql = (strings: TemplateStringsArray, ...keys: RQLValue[]) =>
  new RqlTag (strings.join ("$"), keys);

export default rql;