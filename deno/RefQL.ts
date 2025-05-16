import makeSQL from "./SQLTag/sql.ts";
import makeTable from "./Table/index.ts";
import { RefQLOptions } from "./common/types.ts";
import withDefaultOptions from "./common/withDefaultOptions.ts";
import { getTables } from "./generated/tables.ts";

const RefQL = (options: RefQLOptions) => {
  if (!options.querier) {
    throw new Error ("There was no Querier provided");
  }

  const refQLOptions = withDefaultOptions (options);

  const Table = makeTable (refQLOptions);

  return {
    Table,
    sql: makeSQL (refQLOptions),
    tables: getTables (Table),
    options: refQLOptions
  };
  // return Table with default querier (om tables met te maken)
  // en tables.<schema>.table (met tables) indien introspect gebeurd is
  // met postinstall een lege .refql aanmaken
};

export default RefQL;