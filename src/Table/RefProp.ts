import Table from ".";
import { refqlType } from "../common/consts";
import { RefInfo, RefInput, RefNodeInput, RelType } from "../common/types2";
import RefField from "../RefField";

interface RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any> {
  rel: Rel;
  tableId: TableId;
  as: As;
  refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput;
  child: Table;
  refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>;
  // nullable ?
  getRefInfo: (parent: Table) => RefProp["refInfo"];
}

const type = "refql/RefProp";

const prototype = {
  constructor: RefProp,
  [refqlType]: type,
  getRefInfo
};

function RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any>(as: As, tableId: TableId, rel: Rel, child: Table, refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput) {
  let refProp: RefProp<As, TableId, Rel> = Object.create (prototype);

  refProp.rel = rel;
  refProp.tableId = tableId;
  refProp.as = as;
  refProp.child = child;
  refProp.refInput = refInput;

  return refProp;
}

function getRefInfo<As extends string = any, TableId extends string = any, Rel extends RelType = any>(this: RefProp<As, TableId, Rel>, parent: Table) {
  const { as, rel, child, refInput } = this;

  if (rel === "BelongsTo") {
    const refOf = RefField.refFieldOf (as);

    const refInfo = {
      parent,
      as,
      lRef: refOf (parent, "lref", refInput.lRef || `${child.name}_id`),
      rRef: refOf (child, "rref", refInput.rRef || "id")
    };

    return refInfo;
  }

  return {};
}

RefProp.isRefProp = function (x: any): x is RefProp {
  return x != null && x[refqlType] === type;
};

export default RefProp;