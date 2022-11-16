import Env from ".";
import emptyRefs from "../common/emptyRefs";
import { Refs } from "../common/types";
import SQLTag from "../SQLTag";
import Table from "../Table";

const createEnv = (table: Table, refs?: Refs, inCall = false) => Env ({
  table,
  sqlTag: SQLTag.empty (),
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || emptyRefs (),
  inCall
});

export default createEnv;
