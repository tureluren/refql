import { Pool } from "pg";

const pgQuerier = (pool: Pool) => <T>(query: string, values: any[]) => {
  // console.log (query);
  // console.log (values);
  return pool.query (
    query,
    values
  ).then (({ rows }) => rows as T[]);
};

export default pgQuerier;