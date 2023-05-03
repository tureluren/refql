import Table from ".";
import { RefInput } from "../common/types2";
import RefProp from "./RefProp";

const belongsToMany = <As extends string, TableId extends (string | (() => Table<any, any>))>(as: As, tableId: TableId, input: RefInput = {}) => {
  return RefProp<As, TableId, "BelongsToMany"> (as, tableId, "BelongsToMany", input);
};

export default belongsToMany;