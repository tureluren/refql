import { RefInput } from "../common/types";
import RefProp from "./RefProp";

const belongsToMany = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefInput = {}) =>
  RefProp<As, TableId, "BelongsToMany"> (as, tableId, "BelongsToMany", input);

export default belongsToMany;