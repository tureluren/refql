import evolve from "../Environment2/evolve";
import concat from "../more/concat";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { Rec } from "../types";

const interpretSqlTag = <Input>(params: Input) => (table: Table, correctWhere: boolean = true) => (rec: Rec<Input>) => {
  const { sqlTag, values } = rec;

  let [query, newValues] = compileSqlTag (sqlTag, values.length, params, table);

  if (!query) return rec;

  if (correctWhere) {
    query = query.replace (/^\b(where)\b/i, "and");
  } else {
    query = query.replace (/^\b(and|or)\b/i, "where");
  }

  return evolve ({
    query: q => `${q} ${query}`,
    values: concat (newValues)
  }) (rec);
};

export default interpretSqlTag;