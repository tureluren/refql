import RQLTag from ".";
import { RQLValue } from "../types";

const rql = (strings: TemplateStringsArray, ...keys: RQLValue[]) =>
  new RQLTag (strings.join ("$"), keys);

export default rql;