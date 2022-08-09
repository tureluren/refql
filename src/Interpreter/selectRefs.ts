import Table from "../Table";
import { Key } from "../types";
import keysToComp from "./keysToComp";
import select from "./select";

const selectRefs = (table: Table, keys: Key[]) =>
  select (keysToComp (table, keys));

export default selectRefs;