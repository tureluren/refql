import Table2 from ".";
import { RefNodeInput } from "../common/types2";
import validateTable from "../common/validateTable";
import RefField from "../RefField";
import TableField from "./TableField";
import validateRefInput from "./validateRefInput";

const belongsTo = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) => {
  validateTable (tableId);

  validateRefInput (input);

  return TableField<As, TableId, "BelongsTo"> (as, tableId, "BelongsTo", "" as any, {} as any);

};

// return <As extends string>(as: As, parent: Table2) => {
//   const refOf = RefField.refFieldOf (as);

//   const refInfo = {
//     parent,
//     as,
//     lRef: refOf (parent, "lref", input.lRef || `${child.name}_id`),
//     rRef: refOf (child, "rref", input.rRef || "id")
//   };

//   return TableField<"BelongsTo", Name, As> ("BelongsTo", table, as, child, refInfo);
// };

export default belongsTo;