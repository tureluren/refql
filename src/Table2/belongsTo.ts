import Table2 from ".";
import { RefNodeInput } from "../common/types2";
import validateTable from "../common/validateTable";
import RefField from "../RefField";
import TableField from "./TableField";
import validateRefInput from "./validateRefInput";

export const belongsTo = <Name extends string>(table: Name, input: RefNodeInput = {}) => {
  validateTable (table);

  validateRefInput (input);

  const child = Table2<Name> (table, {});

  return <As extends string>(as: As, parent: Table2) => {
    const refOf = RefField.refFieldOf (as);

    const refInfo = {
      parent,
      as,
      lRef: refOf (parent, "lref", input.lRef || `${child.name}_id`),
      rRef: refOf (child, "rref", input.rRef || "id")
    };

    return TableField<"BelongsTo", Name, As> ("BelongsTo", table, as, parent, child, refInfo);
  };
};

export default belongsTo;