import Table2 from ".";
import { refqlType } from "../common/consts";
import { RefInfo, RelType } from "../common/types2";

interface TableField<Rel extends RelType = any, Name extends string = any, As extends string = any> {
  rel: Rel;
  name: Name;
  as: As;
  refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>;
  parent: Table2;
  child: Table2;
}

const type = "refql/TableField";

const prototype = {
  constructor: TableField,
  [refqlType]: type
};

function TableField<Rel extends RelType = any, Name extends string = any, As extends string = any>(rel: Rel, name: Name, as: As, parent: Table2, child: Table2, refInfo: Rel extends "BelongsToMany" ? Required<RefInfo<As>> : RefInfo<As>) {
  let field: TableField<Rel, Name, As> = Object.create (prototype);

  field.rel = rel;
  field.name = name;
  field.as = as;
  field.parent = parent;
  field.child = child;
  field.refInfo = refInfo;

  return field;
}

TableField.isTableField = function (x: any): x is TableField {
  return x != null && x[refqlType] === type;
};

export default TableField;