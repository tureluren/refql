import Env from ".";
import { Refs } from "../common/types";
import SQLTag from "../SQLTag";
import Table from "../Table";

const createEnv = (table: Table, refs: Refs = {}, inCall = false) => Env ({
  table,
  sqlTag: SQLTag.empty (),
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || {},
  inCall
});

export default createEnv;