import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import Like from "../RQLTag/Like";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import PropType, { propTypePrototype } from "./PropType";

interface Prop<As extends string = any, Type = any> extends RQLNode, PropType<As> {
  col?: string;
  type: Type;
  arrayOf(): Prop<As, Type[]>;
  nullable(): Prop<As, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params2, Type>;
  like<Params2 = {}>(run: TagFunctionVariable<Params2, string> | string): Like<As, Params2>;
  iLike: Prop<As, Type>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): In<As, Params2, Type>;
  asc(): OrderBy<As, false, {}>;
  desc(): OrderBy<As, true, {}>;
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  like,
  iLike,
  in: whereIn,
  asc,
  desc
});

function Prop<As extends string, Type = any>(as: As, col?: string) {
  let prop: Prop<As, Type> = Object.create (prototype);

  prop.as = as;
  prop.col = col;

  return prop;
}

function nullable(this: Prop) {
  return Prop (this.as, this.col);
}

function eq(this: Prop, run: any) {
  return Eq (this.col || this.as, run);
}

function like(this: Prop, run: any) {
  return Like (this.col || this.as, run);
}

function iLike(this: Prop, run: any) {
  return Like (this.col || this.as, run, false);
}

function whereIn(this: Prop, run: any) {
  return In (this.col || this.as, run);
}

function asc(this: Prop) {
  return OrderBy (this.col || this.as, false);
}

function desc(this: Prop) {
  return OrderBy (this.col || this.as, true);
}

Prop.isProp = function <As extends string = any, Type = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;