import RqlTag from ".";
import Parser from "../Parser";
import { RQLValue } from "../types";

const rql = <Input> (strings: TemplateStringsArray, ...keys: RQLValue<Input>[]) => {
  console.log (strings.join ("$"));
  const parser = new Parser<Input> (strings.join ("$"), keys);

  return new RqlTag<Input> (parser.Root ());
};

export default rql;