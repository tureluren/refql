import makeSQL from "./SQLTag/sql";
import makeTable from "./Table";
import { RefQLOptions } from "./common/types";
import withDefaultOptions from "./common/withDefaultOptions";
import { getTables } from "./generated/client";
import introspect from "./introspection";

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
    introspect: () => introspect (sqlRunnerless, refQLOptions)
  };
};

export default RefQL;