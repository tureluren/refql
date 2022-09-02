import { Pool } from "pg";

const querier = (pool: Pool) => <T>(query: string, values: any[]) =>
  pool.query (query, values).then (({ rows }) => rows as T[]);

export default querier;