import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Eq from "./Eq";
import { rqlNodePrototype } from "./isRQLNode";

interface Prop<As extends string = any, Type = unknown, Params = any> {
  as: As;
  col: Params extends Record<any, any> ? SQLTag<Params> : string | undefined;
  type: Type;
  arrayOf(): Prop<As, Type[]>;
  nullable(): Prop<As, Type | null>;
  eq<Params2>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Type, Params extends Record<any, any> ? Params & Params2 : Params2>;
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf,
  nullable,
  eq
});

function Prop<As extends string, Type = unknown, Params = any>(as: As, col?: SQLTag<Params> | string) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col as Params extends Record<any, any> ? SQLTag<Params> : string;

  return prop;
}

function arrayOf<As extends string, Type = unknown, Params = any>(this: Prop<As, Type, Params>) {
  return Prop<As, Type[], Params> (this.as, this.col);
}

function nullable<As extends string, Type = unknown, Params = any>(this: Prop<As, Type, Params>) {
  return Prop<As, Type | null, Params> (this.as, this.col);
}

function eq<As extends string, Type = unknown, Params = any, Params2 = any>(this: Prop<As, Type, Params>, run: TagFunctionVariable<Params2, Type> | Type) {
  return Eq<any> (this.col || this.as, run);
}

Prop.isProp = function (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;