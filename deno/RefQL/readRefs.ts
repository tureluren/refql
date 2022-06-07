import { DBRef, Querier } from "../types.ts";

const refsQuery = `
  select conrelid::regclass as "tableFrom",
    pg_get_constraintdef(oid) as "constraint"
  from "pg_constraint"
  where contype in ('f')
  and connamespace = 'public'::regnamespace
`;

const readRefs = (querier: Querier): Promise<DBRef[]> =>
  querier (refsQuery, []);

export default readRefs;