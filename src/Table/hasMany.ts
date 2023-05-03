import Table from ".";
import { RefNodeInput } from "../common/types2";
import RefProp from "./RefProp";

const hasMany = <As extends string, TableId extends (string | (() => Table<any, any>))>(as: As, tableId: TableId, input: RefNodeInput = {}) =>
  RefProp<As, TableId, "HasMany"> (as, tableId, "HasMany", input);

export default hasMany;