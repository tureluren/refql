import RqlTag from ".";
import Parser from "../Parser";
import { RQLValue } from "../types";

const rql = <Input> (strings: TemplateStringsArray, ...keys: RQLValue<Input>[]) => {
  const parser = new Parser<Input> ();
  const ast = parser.parse (strings.join ("$"), keys);

  return new RqlTag<Input> (ast);
};

export default rql;