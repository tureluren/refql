import { refqlType } from "../common/consts";

interface TableField<Name = unknown, As = unknown, Type = unknown> {
  name: Name;
  as: As;
  type: Type;
}

const type = "refql/TableField";

const prototype = {
  constructor: TableField,
  [refqlType]: type
};

function TableField<Name = unknown, As = unknown, Type = unknown>(name: Name, as: As) {
  let field: TableField<Name, As, Type> = Object.create (prototype);

  field.name = name;
  field.as = as;

  return field;
}

// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default TableField;