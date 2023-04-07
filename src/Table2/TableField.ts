import { refqlType } from "../common/consts";
import { RelType } from "../common/types2";

interface TableField<Rel extends RelType = any, Name extends string = any, As extends string = any> {
  rel: Rel;
  name: Name;
  as: As;
}

const type = "refql/TableField";

const prototype = {
  constructor: TableField,
  [refqlType]: type
};

function TableField<Rel extends RelType = any, Name extends string = any, As extends string = any>(rel: Rel, name: Name, as: As) {
  let field: TableField<Rel, Name, As> = Object.create (prototype);

  field.rel = rel;
  field.name = name;
  field.as = as;

  return field;
}

// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default TableField;