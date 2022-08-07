import Environment from "../Environment2";
import sql from "../SQLTag/sql";
import Table from "../Table";
import { RefsNew } from "../types";

const createEnv = <Input>(table: Table, refs?: RefsNew) => new Environment ({
  table,
  sqlTag: sql<Input>``,
  query: "",
  values: [],
  next: [],
  comps: [],
  refs: refs || {
    lkeys: [],
    rkeys: [],
    lxkeys: [],
    rxkeys: []
  }
});

export default createEnv;
