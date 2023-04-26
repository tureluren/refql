import { refqlType } from "../common/consts";
import SQLTag2 from "../SQLTag2";

interface Prop<As extends string = any, Type = unknown, Params = any> {
  as: As;
  col: Params extends Record<any, any> ? SQLTag2<Params> : string | undefined;
  type: Type;
  arrayOf: () => Prop<As, Type[]>;
  nullable: () => Prop<As, Type | null>;
}

const type = "refql/Prop";

const prototype = {
  constructor: Prop,
  [refqlType]: type
};

function Prop<As extends string, Type = unknown, Params = any>(as: As, col?: SQLTag2<Params> | string) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col as Params extends Record<any, any> ? SQLTag2<Params> : string;

  return prop;
}







// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Prop;