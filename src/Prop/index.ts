import { refqlType } from "../common/consts";
import copyObj from "../common/copyObj";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import IsNull from "../RQLTag/IsNull";
import Like from "../RQLTag/Like";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
import Operation from "../RQLTag/Operation";
import PropType, { propTypePrototype } from "./PropType";

interface Prop<As extends string = any, Type = any, Params = any, IsOmitted extends boolean = false> extends RQLNode, PropType<As> {
  params: Params;
  col?: string | SQLTag<Params>;
  type: Type;
  isOmitted: IsOmitted;
  arrayOf(): Prop<As, Type[], Params, IsOmitted>;
  nullable(): Prop<As, Type | null, Params, IsOmitted>;
  // Because of pred function, Type | undefined
  eq<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type | undefined> | Type, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted>;
  notEq: Prop<As, Type, Params, IsOmitted>["eq"];
  isNull<Params2 = {}>(pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted>;
  notIsNull: Prop<As, Type, Params, IsOmitted>["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string | undefined> | string, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted>;
  notLike: Prop<As, Type, Params, IsOmitted>["like"];
  iLike: Prop<As, Type, Params, IsOmitted>["like"];
  notILike: Prop<As, Type, Params, IsOmitted>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type[] | undefined> | Type[], pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted>;
  notIn: Prop<As, Type, Params, IsOmitted>["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type | undefined> | Type, pred?: TagFunctionVariable<Params & Params2>): Prop<As, Type, Params & Params2, IsOmitted>;
  gte: Prop<As, Type, Params, IsOmitted>["gt"];
  lt: Prop<As, Type, Params, IsOmitted>["gt"];
  lte: Prop<As, Type, Params, IsOmitted>["gt"];
  asc(): Prop<As, Type, Params, IsOmitted>;
  desc: Prop<As, Type, Params, IsOmitted>["asc"];
  operations: Operation<Params>[];
  omit(): Prop<As, Type, Params, true>;
}

const type = "refql/Prop";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: Prop,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq: eq (),
  notEq: eq (true),
  isNull: isNull (),
  notIsNull: isNull (true),
  like: like (true),
  notLike: like (true, true),
  iLike: like (),
  notILike: like (false, true),
  in: whereIn (),
  notIn: whereIn (true),
  gt: ord (">"),
  gte: ord (">="),
  lt: ord ("<"),
  lte: ord ("<="),
  asc: dir (),
  desc: dir (true),
  omit
});

function Prop<As extends string, Type = any, Params = any>(as: As, col?: string | SQLTag<Params>) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col;
  prop.operations = [];
  prop.isOmitted = false;

  return prop;
}

function nullable(this: Prop) {
  return copyObj (this);
}

function eq(notEq?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const eqOp = Eq (run, pred, notEq);

    prop.operations = prop.operations.concat (eqOp);

    return prop;
  };
}

function isNull(notIsNull?: boolean) {
  return function (this: Prop, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const nullOp = IsNull (pred, notIsNull);

    prop.operations = prop.operations.concat (nullOp);

    return prop;
  };
}

function like(caseSensitive?: boolean, notLike?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const likeOp = Like (run, pred, caseSensitive, notLike);

    prop.operations = prop.operations.concat (likeOp);

    return prop;
  };
}

function whereIn(notIn?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const inOp = In (run, pred, notIn);

    prop.operations = prop.operations.concat (inOp);

    return prop;
  };
}

function ord(operator: OrdOperator) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const ordOp = Ord (run, operator, pred);

    prop.operations = prop.operations.concat (ordOp);

    return prop;
  };
}

function dir(descending?: boolean) {
  return function (this: Prop) {
    const prop = copyObj (this);
    const orderByOp = OrderBy (descending);

    prop.operations = prop.operations.concat (orderByOp);

    return prop;
  };
}

function omit(this: any) {
  let prop = copyObj (this);
  prop.isOmitted = true;

  return prop;
}

Prop.isProp = function <As extends string = any, Type = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;