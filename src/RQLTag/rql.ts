import RQLTag from ".";
import Parser from "../Parser";
import { RefQLValue } from "../types";

const rql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
  const parser = new Parser (strings.join ("$"), values);

  return new RQLTag<Params> (parser.Root ());
};

export default rql;