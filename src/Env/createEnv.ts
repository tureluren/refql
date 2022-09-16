import Env from ".";
import { Refs } from "../common/types";
import sql from "../SQLTag/sql";
import Table from "../Table";
import emptyRefs from "./emptyRefs";

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
