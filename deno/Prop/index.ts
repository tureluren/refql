import { refqlType } from "../common/consts.ts";
import { OrdOperator, TagFunctionVariable } from "../common/types.ts";
import Eq from "../RQLTag/Eq.ts";
import In from "../RQLTag/In.ts";
import IsNull from "../RQLTag/IsNull.ts";
import Like from "../RQLTag/Like.ts";
import Ord from "../RQLTag/Ord.ts";
import OrderBy from "../RQLTag/OrderBy.ts";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode.ts";
import PropType, { propTypePrototype } from "./PropType.ts";

interface Prop<As extends string = any, Type = any> extends RQLNode, PropType<As> {
  col?: string;
  type: Type;
  arrayOf(): Prop<As, Type[]>;
  nullable(): Prop<As, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params2, Type>;
  isNull<Params2 = {}>(): IsNull<As, Params2>;
  like<Params2 = {}>(run: TagFunctionVariable<Params2, string> | string): Like<As, Params2>;
  iLike: Prop<As, Type>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): In<As, Params2, Type>;
  gt<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Ord<As, Params2, Type>;
  gte: Prop<As, Type>["gt"];
  lt: Prop<As, Type>["gt"];
  lte: Prop<As, Type>["gt"];
  asc(): OrderBy<As, {}>;
  desc: Prop<As, Type>["asc"];
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  isNull,
  like: like (),
  iLike: like (false),
  in: whereIn,
  gt: ord (">"),
  gte: ord (">="),
  lt: ord ("<"),
  lte: ord ("<="),
  asc: dir (),
  desc: dir (true)
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

function isNull(this: Prop) {
  return IsNull (this.col || this.as);
}

function like(caseSensitive?: boolean) {
  return function (this: Prop, run: any) {
    return Like (this.col || this.as, run, caseSensitive);
  };
}

function whereIn(this: Prop, run: any) {
  return In (this.col || this.as, run);
}

function ord(operator: OrdOperator) {
  return function (this: Prop, run: any) {
    return Ord (this.col || this.as, run, operator);
  };
}

function dir(descending?: boolean) {
  return function (this: Prop) {
    return OrderBy (this.col || this.as, descending);
  };
}

Prop.isProp = function <As extends string = any, Type = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;