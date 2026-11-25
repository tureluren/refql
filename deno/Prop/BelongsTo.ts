import { RefNodeInput } from "../common/types.ts";
import RefProp from "./RefProp.ts";

const BelongsTo = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "BelongsTo", false> (as, tableId, "BelongsTo", input, false);

export default BelongsTo;