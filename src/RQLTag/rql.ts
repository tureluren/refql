import RQLTag from ".";
import Parser from "../Parser";
import { RQLValue } from "../types";

const rql = <Input, Output> (strings: TemplateStringsArray, ...keys: RQLValue<Input>[]) => {
  const parser = new Parser<Input> ();
  const ast = parser.parse (strings.join ("$"), keys);

  return new RQLTag<Input, Output> (ast);
};

export default rql;