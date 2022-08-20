import RqlTag from ".";
import Parser from "../Parser";
import { RQLValue } from "../types";

const rql = <Params> (strings: TemplateStringsArray, ...values: RQLValue<Params>[]) => {
  const parser = Parser.of (strings.join ("$"), values);

  return new RqlTag<Params> (parser.Root ());
};

export default rql;