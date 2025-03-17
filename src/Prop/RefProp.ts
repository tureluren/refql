import { refqlType } from "../common/consts";
import { RefInput, RefNodeInput, RelType } from "../common/types";
import Table from "../Table";
import PropType, { propTypePrototype } from "./PropType";
import validateRefInput from "./validateRefInput";

interface RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any, Nullable extends boolean = any> extends PropType<As> {
  rel: Rel;
  tableId: TableId;
  refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput;
  child: Table;
  isNullable: Nullable;
  nullable(): RefProp<As, TableId, Rel, true>;
}

const type = "refql/RefProp";

const prototype = Object.assign ({}, propTypePrototype, {
  constructor: RefProp,
  [refqlType]: type,
  nullable
});

function RefProp<As extends string, TableId extends string, Rel extends RelType, Nullable extends boolean>(as: As, tableId: TableId, rel: Rel, refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput, isNullable: Nullable) {
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

function nullable(this: RefProp) {
  return RefProp (this.as, this.tableId, this.rel, this.refInput, true);
}

RefProp.isRefProp = function <As extends string = any, TableId extends string = any, Rel extends RelType = any, Nullable extends boolean = false> (x: any): x is RefProp<As, TableId, Rel, Nullable> {
  return x != null && x[refqlType] === type;
};

export default RefProp;