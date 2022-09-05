import { evolve } from "../Env/access.ts";
import concat from "../more/concat.ts";
import compileSQLTag from "../SQLTag/compileSQLTag.ts";
import Table from "../Table/index.ts";
import { Rec } from "../types.ts";

const interpretSQLTag = <Params>(params: Params) => (table: Table, correctWhere: boolean = true) => (rec: Rec<Params>) => {
  const { sqlTag, values } = rec;

  let [query, newValues] = compileSQLTag (sqlTag, values.length, params, table);

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

export default interpretSQLTag;