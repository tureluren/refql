import evolve from "../Environment2/evolve";
import concat from "../more/concat";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { EnvRecord } from "../types";

const interpretSqlTag = <Input>(params: Input) => (table: Table, correctWhere: boolean = true) => (record: EnvRecord<Input>) => {
  const { sqlTag, values } = record;

  let [query, newValues] = compileSqlTag (sqlTag, values.length, params, table);

  if (!query) return record;

  if (correctWhere) {
    query = query.replace (/^\b(where)\b/i, "and");
  } else {
    query = query.replace (/^\b(and|or)\b/i, "where");
  }

  return evolve ({
    query: q => `${q} ${query}`,
    values: concat (newValues)
  }) (record);
};

export default interpretSqlTag;