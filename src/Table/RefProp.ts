import Table from ".";
import { refqlType } from "../common/consts";
import { RefInfo, RelType } from "../common/types2";

interface RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any> {
  rel: Rel;
  tableId: TableId;
  as: As;
  refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>;
  child: Table;
  // nullable ?
}

const type = "refql/RefProp";

const prototype = {
  constructor: RefProp,
  [refqlType]: type
};

function RefProp<As extends string = any, TableId extends string = any, Rel extends RelType = any>(as: As, tableId: TableId, rel: Rel, child: Table, refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>) {
  let refProp: RefProp<As, TableId, Rel> = Object.create (prototype);

  refProp.rel = rel;
  refProp.tableId = tableId;
  refProp.as = as;
  refProp.child = child;
  refProp.refInfo = refInfo;

  return refProp;
}

RefProp.isRefProp = function (x: any): x is RefProp {
  return x != null && x[refqlType] === type;
};

export default RefProp;