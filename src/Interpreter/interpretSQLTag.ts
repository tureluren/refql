import evolve from "../Environment2/evolve";
import compileSQLTag from "../SQLTag/compileSQLTag";
import Table from "../Table";
import { EnvRecord } from "../types";

const interpretSQLTag = <Input>(params?: Input) => (table: Table) => (record: EnvRecord<Input>) => {
  const { sqlTag, values } = record;

  const [query, newValues] = compileSQLTag (sqlTag, values.length, params, table);

  return evolve ({
    query: q => `${q} ${query}`,
    values: v => v.concat (newValues)
  }) (record);
};

export default interpretSQLTag;