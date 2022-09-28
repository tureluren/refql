import Env from "./index.ts";
import emptyRefs from "../common/emptyRefs.ts";
import { Refs } from "../common/types.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";

const createEnv = (table: Table, refs?: Refs, inCall = false) => Env ({
  table,
  sqlTag: sql``,
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || emptyRefs (),
  inCall
});

export default createEnv;
