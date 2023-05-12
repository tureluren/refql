import { RefNodeInput } from "../common/types";
import RefProp from "./RefProp";

const hasOne = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "HasOne", false> (as, tableId, "HasOne", input, false);

export default hasOne;