import { evolve } from "../Env/access";
import concat from "../more/concat";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { Rec } from "../types";

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