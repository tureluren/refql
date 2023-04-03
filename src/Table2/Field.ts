import { refqlType } from "../common/consts";

interface Field<As = unknown, Type = unknown> {
  name: string;
  as: As;
  type: Type;
}

const type = "refql/Field";

const prototype = {
  constructor: Field,
  [refqlType]: type
};

function Field<As = unknown, Type = unknown>(name: string, as: As) {
  let field: Field<As, Type> = Object.create (prototype);

  field.name = name;
  field.as = as;

  return field;
}

// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Field;