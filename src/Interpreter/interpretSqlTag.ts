import evolve from "../Environment2/evolve";
import concat from "../more/concat";
import compileSqlTag from "../SqlTag/compileSqlTag";
import Table from "../Table";
import { EnvRecord } from "../types";

const interpretSqlTag = <Input>(params: Input) => (table: Table) => (record: EnvRecord<Input>) => {
  const { sqlTag, values } = record;

  const [query, newValues] = compileSqlTag (sqlTag, values.length, params, table);

  return evolve ({
    query: q => `${q} ${query}`,
    values: concat (newValues)
  }) (record);
};

export default interpretSqlTag;