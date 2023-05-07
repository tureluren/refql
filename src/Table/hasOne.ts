import { RefNodeInput } from "../common/types2";
import RefProp from "./RefProp";

const hasOne = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) => {
  return RefProp<As, TableId, "HasOne"> (as, tableId, "HasOne", input);
};

export default hasOne;