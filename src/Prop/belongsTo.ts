import { RefNodeInput } from "../common/types";
import RefProp from "./RefProp";

const belongsTo = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "BelongsTo", false> (as, tableId, "BelongsTo", input, false);

export default belongsTo;