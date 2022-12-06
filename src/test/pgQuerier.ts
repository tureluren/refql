import { Pool } from "pg";

const pgQuerier = (pool: Pool) => <T>(query: string, values: any[]) => {
  return pool.query (
    query,
    values
  ).then (({ rows }) => rows as T[]);
};

export default pgQuerier;