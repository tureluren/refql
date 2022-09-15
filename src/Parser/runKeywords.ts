import Table from "../Table";
import { StringMap } from "../types";

const runKeywords = (params: StringMap, table: Table, keywords: StringMap) =>
  (Object.keys (keywords) as (keyof typeof keywords)[]).reduce ((acc, key) => {
    const kw = keywords[key];
    acc[key] = typeof kw === "function" ? kw (params, table) : kw;
    return acc;
  }, {} as StringMap);

export default runKeywords;