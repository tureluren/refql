import { Pool, QueryArrayResult } from "pg";

const querier = (pool: Pool) => <T extends QueryArrayResult>(query: string, values: any[]) =>
  pool.query<T> (query, values).then (({ rows }) => rows);

export default querier;