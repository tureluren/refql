import Environment from "../Environment2";
import sql from "../SqlTag/sql";
import Table from "../Table";
import { Refs } from "../types";
import emptyRefs from "./emptyRefs";

const createEnv = <Params>(table: Table, refs?: Refs, inCall = false) => Environment.of ({
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
