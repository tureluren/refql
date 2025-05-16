import makeSQL from "./SQLTag/sql";
import makeTable from "./Table";
import { RefQLOptions } from "./common/types";
import withDefaultOptions from "./common/withDefaultOptions";
import { getTables } from "./generated/tables";

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
  // met postinstall een lege .refql aanmaken, met een lege getTables, via programma (introspect van refql aanroepen die dan in .refql introspect plaatst)
};

export default RefQL;