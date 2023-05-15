import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Eq from "./Eq";
import { rqlNodePrototype } from "./isRQLNode";
import PropType from "./PropType";


interface Prop<As extends string = any, Type = unknown> {
  as: As;
  col?: string;
  type: Type;
  arrayOf(): Prop<As, Type[]>;
  nullable(): Prop<As, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Type, Params2>;
  [PropType]: true;
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  [PropType]: true
});

function Prop<As extends string, Type = unknown>(as: As, col?: string) {
  let prop: Prop<As, Type> = Object.create (prototype);

  prop.as = as;
  prop.col = col;

  return prop;
}

function nullable(this: Prop) {
  return Prop (this.as, this.col);
}

function eq(this: Prop, run: any) {
  return Eq<any> (this.col || this.as, run);
}

Prop.isProp = function (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;