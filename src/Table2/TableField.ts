import Table2 from ".";
import { refqlType } from "../common/consts";
import { RefInfo, RelType } from "../common/types2";

interface TableField<As extends string = any, TableId extends string = any, Rel extends RelType = any> {
  rel: Rel;
  tableId: TableId;
  as: As;
  refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>;
  child: Table2;
  // nullable ?
}

const type = "refql/TableField";

const prototype = {
  constructor: TableField,
  [refqlType]: type
};

function TableField<As extends string = any, TableId extends string = any, Rel extends RelType = any>(as: As, tableId: TableId, rel: Rel, child: Table2, refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>) {
  let field: TableField<As, TableId, Rel> = Object.create (prototype);

  field.rel = rel;
  field.tableId = tableId;
  field.as = as;
  field.child = child;
  field.refInfo = refInfo;

  return field;
}

TableField.isTableField = function (x: any): x is TableField {
  return x != null && x[refqlType] === type;
};

export default TableField;