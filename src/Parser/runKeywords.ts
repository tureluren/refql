import Table from "../Table";
import { Keywords } from "../types";

const runKeywords = <Params>(params: Params, table: Table, keywords: Keywords<Params, boolean>) =>
  (Object.keys (keywords) as (keyof typeof keywords)[]).reduce ((acc, key) => {
    const kw = keywords[key];
    acc[key] = typeof kw === "function" ? kw (params, table) : kw;
    return acc;
  }, {} as Keywords<Params, true>);

export default runKeywords;