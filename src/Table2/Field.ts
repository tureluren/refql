import { refqlType } from "../common/consts";
import SQLTag2 from "../SQLTag2";

interface Field<As extends string = any, Type = unknown, Params = any> {
  as: As;
  col: Params extends Record<any, any> ? SQLTag2<Params> : string | undefined;
  type: Type;
  arrayOf: () => Field<As, Type[]>;
  nullable: () => Field<As, Type | null>;
}

const type = "refql/Field";

const prototype = {
  constructor: Field,
  [refqlType]: type
};

function Field<As extends string, Type = unknown, Params = any>(as: As, col?: SQLTag2<Params> | string) {
  let field: Field<As, Type, Params> = Object.create (prototype);

  field.as = as;
  field.col = col as Params extends Record<any, any> ? SQLTag2<Params> : string;

  return field;
}







// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Field;