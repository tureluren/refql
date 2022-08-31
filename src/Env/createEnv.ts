import Env from ".";
import emptyRefs from "../more/emptyRefs";
import sql from "../SqlTag/sql";
import Table from "../Table";
import { Refs } from "../types";

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
