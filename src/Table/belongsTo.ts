import Table from ".";
import { RefNodeInput } from "../common/types";
import validateTable from "../common/validateTable";
import RefField from "../RefField";
import RefProp from "./RefProp";
import validateRefInput from "./validateRefInput";

const belongsTo = <As extends string, TableId extends string>(as: As, tableId: TableId, input: RefNodeInput = {}) => {
  // validateTable (tableId);

  validateRefInput (input);

  // const child = typeof tableId === "string" ? Table (tableId, []) : tableId;

  return RefProp<As, TableId, "BelongsTo"> (as, tableId, "BelongsTo", input);
};

// return <As extends string>(as: As, parent: Table) => {
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