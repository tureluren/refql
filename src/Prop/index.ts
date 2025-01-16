import { refqlType } from "../common/consts";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import IsNull from "../RQLTag/IsNull";
import Like from "../RQLTag/Like";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import Operation from "../Table/Operation";
import PropType, { propTypePrototype } from "./PropType";

interface Prop<As extends string = any, Type = any, Params = any> extends RQLNode, PropType<As> {
  col?: string;
  type: Type;
  arrayOf(): Prop<As, Type[]>;
  nullable(): Prop<As, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Prop<As, Type, Params2>;
  notEq: Prop<As, Type, Params>["eq"];
  isNull<Params2 = {}>(): Prop<As, Type, Params2>;
  like<Params2 = {}>(run: TagFunctionVariable<Params2, string> | string): Prop<As, Type, Params2>;
  iLike: Prop<As, Type, Params>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): Prop<As, Type, Params2>;
  gt<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Prop<As, Type, Params2>;
  gte: Prop<As, Type, Params>["gt"];
  lt: Prop<As, Type, Params>["gt"];
  lte: Prop<As, Type, Params>["gt"];
  asc(): Prop<As, Type, Params>;
  desc: Prop<As, Type, Params>["asc"];
  operations: Operation<Params>[];
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq: eq (),
  notEq: eq (true),
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

function Prop<As extends string, Type = any, Params = any>(as: As, col?: string) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col;
  prop.operations = [];

  return prop;
}

function nullable(this: Prop) {
  return Prop (this.as, this.col);
}

function eq(notEq?: boolean) {
  return function (this: Prop, run: any) {
    const prop = Prop (this.as, this.col);
    const eqOp = Eq (prop.col || prop.as, run, notEq);

    prop.operations = this.operations.concat (eqOp);

    return prop;
  };
}

function isNull(this: Prop) {
  const prop = Prop (this.as, this.col);
  const nullOp = IsNull (prop.col || prop.as);

  prop.operations = this.operations.concat (nullOp);

  return prop;
}

function like(caseSensitive?: boolean) {
  return function (this: Prop, run: any) {
    const prop = Prop (this.as, this.col);
    const likeOp = Like (prop.col || prop.as, run, caseSensitive);

    prop.operations = this.operations.concat (likeOp);

    return prop;
  };
}

function whereIn(this: Prop, run: any) {
  const prop = Prop (this.as, this.col);
  const inOp = In (prop.col || prop.as, run);

  prop.operations = this.operations.concat (inOp);

  return prop;
}

function ord(operator: OrdOperator) {
  return function (this: Prop, run: any) {
    const prop = Prop (this.as, this.col);
    const ordOp = Ord (prop.col || prop.as, run, operator);

    prop.operations = this.operations.concat (ordOp);

    return prop;
  };
}

function dir(descending?: boolean) {
  return function (this: Prop) {
    const prop = Prop (this.as, this.col);
    const orderByOp = OrderBy (prop.col || prop.as, descending);

    prop.operations = this.operations.concat (orderByOp);

    return prop;
  };
}

Prop.isProp = function <As extends string = any, Type = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;