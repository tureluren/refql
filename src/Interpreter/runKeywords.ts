import isFunction from "../predicate/isFunction";
import Table from "../Table";
import { Keywords } from "../types";

const runKeywords = <Input>(params: Input, table: Table, keywords: Keywords<Input, boolean>) =>
  (Object.keys (keywords) as (keyof typeof keywords)[]).reduce ((acc, key) => {
    const kw = keywords[key];
    acc[key] = isFunction (kw) ? kw (params, table) : kw;
    return acc;
  }, {} as Keywords<Input, true>);

export default runKeywords;