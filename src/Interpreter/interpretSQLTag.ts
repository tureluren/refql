import { evolve } from "../Env/access";
import Rec from "../Env/Rec";
import concat from "../common/concat";
import SQLTag from "../SQLTag";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";

const interpretSQLTag = <Params>(params: Params) => (table: Table, correctWhere: boolean = true) => (rec: Rec) => {
  const { sqlTag, values } = rec;

  let [query, newValues] = compileSQLTag (sqlTag as SQLTag<Params>, values.length, params, table);

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