import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import IsNull from "../RQLTag/IsNull";
import Like from "../RQLTag/Like";
import Operation from "../RQLTag/Operation";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { refqlType } from "../common/consts";
import copyObj from "../common/copyObj";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import PropType, { propTypePrototype } from "./PropType";

interface Prop<As extends string = any, Type = any, Params = any, IsOmitted extends boolean = any, HasDefault extends boolean = any> extends RQLNode, PropType<As> {
  params: Params;
  col?: string;
  type: Type;
  isOmitted: IsOmitted;
  hasDefaultValue: HasDefault;
  arrayOf(): Prop<As, Type[], Params, IsOmitted, HasDefault>;
  nullable(): Prop<As, Type | null, Params, IsOmitted, HasDefault>;
  // Because of pred function, Type | undefined
  eq<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type | undefined> | Type, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted, HasDefault>;
  notEq: Prop<As, Type, Params, IsOmitted, HasDefault>["eq"];
  isNull<Params2 = {}>(pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted, HasDefault>;
  notIsNull: Prop<As, Type, Params, IsOmitted, HasDefault>["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string | undefined> | string, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted, HasDefault>;
  notLike: Prop<As, Type, Params, IsOmitted, HasDefault>["like"];
  iLike: Prop<As, Type, Params, IsOmitted, HasDefault>["like"];
  notILike: Prop<As, Type, Params, IsOmitted, HasDefault>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type[] | undefined> | Type[], pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Type, Params & Params2, IsOmitted, HasDefault>;
  notIn: Prop<As, Type, Params, IsOmitted, HasDefault>["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Type | undefined> | Type, pred?: TagFunctionVariable<Params & Params2>): Prop<As, Type, Params & Params2, IsOmitted, HasDefault>;
  gte: Prop<As, Type, Params, IsOmitted, HasDefault>["gt"];
  lt: Prop<As, Type, Params, IsOmitted, HasDefault>["gt"];
  lte: Prop<As, Type, Params, IsOmitted, HasDefault>["gt"];
  asc(): Prop<As, Type, Params, IsOmitted, HasDefault>;
  desc: Prop<As, Type, Params, IsOmitted, HasDefault>["asc"];
  operations: Operation<Params>[];
  omit(): Prop<As, Type, Params, true, HasDefault>;
  hasDefault(): Prop<As, Type, Params, IsOmitted, true>;
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
  omit,
  hasDefault
});

function Prop<As extends string, Type = any, Params = any>(as: As, col?: string) {
  let prop: Prop<As, Type, Params> = Object.create (prototype);

  prop.as = as;
  prop.col = col;
  prop.operations = [];
  prop.isOmitted = false;
  prop.hasDefaultValue = false;

  return prop;
}

export function nullable(this: Prop) {
  return copyObj (this);
}

export function eq(notEq?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const eqOp = Eq (run, pred, notEq);

    prop.operations = prop.operations.concat (eqOp);

    return prop;
  };
}

export function isNull(notIsNull?: boolean) {
  return function (this: Prop, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const nullOp = IsNull (pred, notIsNull);

    prop.operations = prop.operations.concat (nullOp);

    return prop;
  };
}

export function like(caseSensitive?: boolean, notLike?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const likeOp = Like (run, pred, caseSensitive, notLike);

    prop.operations = prop.operations.concat (likeOp);

    return prop;
  };
}

export function whereIn(notIn?: boolean) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const inOp = In (run, pred, notIn);

    prop.operations = prop.operations.concat (inOp);

    return prop;
  };
}

export function ord(operator: OrdOperator) {
  return function (this: Prop, run: any, pred?: TagFunctionVariable<any, boolean>) {
    const prop = copyObj (this);
    const ordOp = Ord (run, operator, pred);

    prop.operations = prop.operations.concat (ordOp);

    return prop;
  };
}

export function dir(descending?: boolean) {
  return function (this: Prop) {
    const prop = copyObj (this);
    const orderByOp = OrderBy (descending);

    prop.operations = prop.operations.concat (orderByOp);

    return prop;
  };
}

export function omit(this: Prop) {
  let prop = copyObj (this);
  prop.isOmitted = true;

  return prop;
}

function hasDefault(this: Prop) {
  let prop = copyObj (this);
  prop.hasDefaultValue = true;

  return prop;
}

Prop.isProp = function <As extends string = any, Type = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;