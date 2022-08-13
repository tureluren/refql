import Environment from "../Environment2";
import sql from "../SqlTag/sql";
import Table from "../Table";
import { Refs } from "../types";
import emptyRefs from "./emptyRefs";

const createEnv = <Input>(table: Table, refs?: Refs, inCall = false) => new Environment ({
  table,
  sqlTag: sql<Input>``,
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || emptyRefs (),
  inCall
});

export default createEnv;
