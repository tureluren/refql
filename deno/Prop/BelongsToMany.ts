import { RefInput } from "../common/types.ts";
import RefProp from "./RefProp.ts";

const BelongsToMany = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefInput = {}) =>
  RefProp<As, TableId, "BelongsToMany", false> (as, tableId, "BelongsToMany", input, false);

export default BelongsToMany;