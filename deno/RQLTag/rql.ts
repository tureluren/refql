import RQLTag from "./index.ts";
import { RefQLValue } from "../common/types.ts";
import Parser from "../Parser/index.ts";

const rql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
  const parser = new Parser (strings.join ("$"), values);

  return RQLTag<Params> (parser.Root ());
};

export default rql;