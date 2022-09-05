import Env from "./index.ts";
import emptyRefs from "../more/emptyRefs.ts";
import sql from "../SQLTag/sql.ts";
import Table from "../Table/index.ts";
import { Refs } from "../types.ts";

const createEnv = <Params>(table: Table, refs?: Refs, inCall = false) => Env.of ({
  table,
  sqlTag: sql<Params>``,
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || emptyRefs (),
  inCall
});

export default createEnv;
