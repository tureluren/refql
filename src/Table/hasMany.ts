import { RefNodeInput } from "../common/types";
import RefProp from "./RefProp";

const hasMany = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "HasMany"> (as, tableId, "HasMany", input);

export default hasMany;