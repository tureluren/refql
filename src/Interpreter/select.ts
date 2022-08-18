import over from "../Environment2/over";
import concat from "../more/concat";
import { EnvRecord } from "../types";

const select = <Input>(comps: string | string[], record: EnvRecord<Input>) =>
  over ("comps", concat (comps), record);

export default select;