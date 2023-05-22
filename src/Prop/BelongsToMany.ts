import { RefInput } from "../common/types";
import RefProp from "./RefProp";

const BelongsToMany = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefInput = {}) =>
  RefProp<As, TableId, "BelongsToMany", false> (as, tableId, "BelongsToMany", input, false);

export default BelongsToMany;