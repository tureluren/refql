import RQLTag from "./index.ts";
import Parser from "../Parser/index.ts";
import { RefQLValue } from "../types.ts";

const rql = <Params> (strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
  const parser = Parser.of (strings.join ("$"), values);

  return new RQLTag<Params> (parser.Root ());
};

export default rql;