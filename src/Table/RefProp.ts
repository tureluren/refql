import Table from ".";
import { refqlType } from "../common/consts";
import { RefInput, RefNodeInput, RelType } from "../common/types";
import validateRefInput from "./validateRefInput";

interface RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any, Nullable extends boolean = false> {
  rel: Rel;
  tableId: TableId;
  as: As;
  refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput;
  child: Table;
  isNullable: Nullable;
  nullable(): RefProp<As, TableId, Rel, true>;
}

const type = "refql/RefProp";

const prototype = {
  constructor: RefProp,
  [refqlType]: type,
  nullable
};

function RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any, Nullable extends boolean = false>(as: As, tableId: TableId, rel: Rel, refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput, isNullable: Nullable) {
  validateRefInput (refInput);

  let refProp: RefProp<As, TableId, Rel, Nullable> = Object.create (prototype);

  refProp.tableId = tableId;
  refProp.rel = rel;
  refProp.as = as;
  refProp.child = Table (tableId, []);
  refProp.refInput = refInput;
  refProp.isNullable = isNullable;

  return refProp;
}

function nullable<As extends string, TableId extends string = any, Rel extends RelType = any>(this: RefProp<As, TableId, Rel>) {
  return RefProp<As, TableId, Rel, true> (this.as, this.tableId, this.rel, this.refInput, true);
}

RefProp.isRefProp = function (x: any): x is RefProp {
  return x != null && x[refqlType] === type;
};

export default RefProp;