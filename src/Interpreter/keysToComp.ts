import Table from "../Table";
import { Key } from "../types";

const keysToComp = (table: Table, keys: Key[]) =>
  keys.map (k => `${table.as}.${k.name} as ${k.as}`);

export default keysToComp;