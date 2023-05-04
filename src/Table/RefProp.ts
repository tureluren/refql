import Table from ".";
import { refqlType } from "../common/consts";
import { RefInput, RefNodeInput, RelType } from "../common/types2";

interface RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any> {
  rel: Rel;
  tableId: TableId;
  as: As;
  refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput;
  child: string | (() => Table);
  // nullable ?
}

const type = "refql/RefProp";

const prototype = {
  constructor: RefProp,
  [refqlType]: type
};

function RefProp<As extends string = any, TableId extends(string | (() => Table)) = any, Rel extends RelType = any>(as: As, tableId: TableId, rel: Rel, refInput: Rel extends "BelongsToMany" ? RefInput : RefNodeInput) {
  let refProp: RefProp<As, TableId extends string ? TableId : TableId extends () => Table ? ReturnType<TableId>["tableId"] : never, Rel> = Object.create (prototype);

  refProp.rel = rel;
  refProp.as = as;
  refProp.child = tableId;
  refProp.refInput = refInput;

  return refProp;
}

RefProp.isRefProp = function (x: any): x is RefProp {
  return x != null && x[refqlType] === type;
};

export default RefProp;