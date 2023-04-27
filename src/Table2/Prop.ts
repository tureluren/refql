import { refqlType } from "../common/consts";
import { SQLTag2 } from "../SQLTag2";

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
  [refqlType]: type,
  arrayOf,
  nullable
};

function Prop<As extends string, Type = unknown, Params = any>(as: As, col?: SQLTag2<Params> | string) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col as Params extends Record<any, any> ? SQLTag2<Params> : string;

  return prop;
}

function arrayOf<As extends string, Type = unknown, Params = any>(this: Prop<As, Type, Params>) {
  return Prop<As, Type[], Params> (this.as, this.col);
}

function nullable<As extends string, Type = unknown, Params = any>(this: Prop<As, Type, Params>) {
  return Prop<As, Type | null, Params> (this.as, this.col);
}


// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default Prop;