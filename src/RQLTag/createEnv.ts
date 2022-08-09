import Environment from "../Environment2";
import sql from "../SQLTag/sql";
import Table from "../Table";
import { Refs } from "../types";
import emptyRefs from "./emptyRefs";

const createEnv = <Input>(table: Table, refs?: Refs) => new Environment ({
  table,
  sqlTag: sql<Input>``,
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || emptyRefs ()
});

export default createEnv;
