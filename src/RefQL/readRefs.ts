import { Pool } from "pg";
import { DBRef } from "../types";

const refsQuery = `
  select conrelid::regclass as "tableFrom",
    pg_get_constraintdef(oid) as "constraint"
  from "pg_constraint"
  where contype in ('f')
  and connamespace = 'public'::regnamespace
`;

const readRefs = (pool: Pool): Promise<DBRef[]> =>
  pool
    .query (refsQuery)
    .then (({ rows }) => rows);

export default readRefs;