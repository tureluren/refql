import RQLTag from "./index.ts";
import { RQLValue } from "../types.ts";

const rql = (strings: TemplateStringsArray, ...keys: RQLValue[]) =>
  new RQLTag (strings.join ("$"), keys);

export default rql;