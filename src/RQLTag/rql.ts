import RQLTag from ".";
import { RefQLValue } from "../common/types";
import Parser from "../Parser";

const rql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
  const parser = new Parser (strings.join ("$"), values);

  return RQLTag<Params> (parser.Root ());
};

export default rql;