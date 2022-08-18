import Table from "../Table";
import { EnvRecord, Key } from "../types";
import keysToComp from "./keysToComp";
import select from "./select";

const selectRefs = (table: Table, keys: Key[]) => <Input>(record: EnvRecord<Input>) =>
  select (keysToComp (table, keys), record);

export default selectRefs;