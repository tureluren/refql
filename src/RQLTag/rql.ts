import RQLTag from ".";
import { RQLValue } from "../types";

const rql = (strings: TemplateStringsArray, ...keys: RQLValue[]) =>
  RQLTag (strings.join ("$"), keys);

export default rql;