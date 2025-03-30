import makeSQL from "./SQLTag/sql";
import makeTable from "./Table";
import defaultRunner from "./common/defaultRunner";
import { Querier, Runner } from "./common/types";
import { getTables } from "./generated/tables";

export interface RefQLOptions {
  querier: Querier;
  runner?: Runner;
}

const RefQL = (options: RefQLOptions) => {
  // wrapper instead of convertPromise zodat tag kan gerund worden in environment
  // querier
  // tables
  // parameterSign, "?" : $
  // run kan nog querier providen als 2e argument

  if (!options.querier) {
    throw new Error ("There was no Querier provided");
  }

  const Table = makeTable (options.querier, options.runner || defaultRunner);

  return {
    Table,
    sql: makeSQL (options.querier, options.runner || defaultRunner),
    tables: getTables (Table)
  };
  // return Table with default querier (om tables met te maken)
  // en tables.<schema>.table (met tables) indien introspect gebeurd is
  // met postinstall een lege .refql aanmaken
};

export default RefQL;