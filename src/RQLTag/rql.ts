import RQLTag from ".";
import Parser from "../Parser";
import { Root } from "../Parser/nodes";
import { RefQLValue } from "../types";

const rql = <Params = {}> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
  const parser = new Parser (strings.join ("$"), values);

  return RQLTag<Params> (parser.Root () as Root<Params>);
};

export default rql;