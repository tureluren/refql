import makeSQL from "./SQLTag/sql.ts";
import makeTable from "./Table/index.ts";
import { RefQLOptions } from "./common/types.ts";
import withDefaultOptions from "./common/withDefaultOptions.ts";
import { getTables } from "./generated/client.ts";
import introspect from "./introspection/index.ts";

const RefQL = (options: RefQLOptions) => {
  if (!options.querier) {
    throw new Error ("There was no Querier provided");
  }

  const refQLOptions = withDefaultOptions (options);

  const Table = makeTable (refQLOptions);

  const sql = makeSQL (refQLOptions);

  // make sure we're working with promises when introspecting
  const sqlRunnerless = makeSQL (withDefaultOptions ({ querier: refQLOptions.querier }));

  return {
    Table,
    sql,
    tables: getTables (Table),
    options: refQLOptions,
    introspect: () => introspect (sqlRunnerless)
  };
  // return Table with default querier (om tables met te maken)
  // met postinstall een lege .refql aanmaken, met een lege getTables, via programma (introspect van refql aanroepen die dan in .refql introspect plaatst)
};

export default RefQL;