import { Pool } from "pg";

const pgQuerier = (pool: Pool) => <T>(query: string, values: any[]) => {
  const pgQuery = values.reduce ((acc, _value, idx) => acc.replace (/\?/, `$${idx + 1}`), query);
  console.log (pgQuery);
  console.log (values);
  return pool.query (
    pgQuery,
    values
  ).then (({ rows }) => rows as T[]);
};

export default pgQuerier;