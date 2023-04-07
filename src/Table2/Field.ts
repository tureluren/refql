import { refqlType } from "../common/consts";

interface Field<Name extends string = any, As extends string = any, Type = unknown> {
  name: Name;
  as: As;
  type: Type;
}

const type = "refql/Field";

const prototype = {
  constructor: Field,
  [refqlType]: type
};

function Field<Name extends string = any, As extends string = any, Type = unknown>(name: Name, as: As) {
  let field: Field<Name, As, Type> = Object.create (prototype);

  field.name = name;
  field.as = as;

  return field;
}

// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Field;