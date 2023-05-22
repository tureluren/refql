import { RefNodeInput } from "../common/types";
import RefProp from "./RefProp";

const HasMany = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "HasMany", false> (as, tableId, "HasMany", input, false);

export default HasMany;