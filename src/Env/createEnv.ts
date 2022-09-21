import Env from ".";
import emptyRefs from "../common/emptyRefs";
import { Refs } from "../common/types";
import sql from "../SQLTag/sql";
import Table from "../Table";

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
