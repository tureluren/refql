import { refqlType } from "../common/consts";

interface Field<As extends string = any, Type = unknown> {
  as: As;
  col?: string;
  type: Type;
  arrayOf: () => Field<As, Type[]>;
}

const type = "refql/Field";

const prototype = {
  constructor: Field,
  [refqlType]: type
};

function Field<As extends string, Type = unknown>(as: As, col?: string) {
  let field: Field<As, Type> = Object.create (prototype);

  field.as = as;
  field.col = col;

  return field;
}









// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Field;