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

interface Prop<As extends string = any, Output = any, Params = any, IsOmitted extends boolean = any, HasDefault extends boolean = any, HasOp extends boolean = any> extends RQLNode, PropType<As> {
  params: Params;
  col?: string;
  output: Output;
  isOmitted: IsOmitted;
  hasDefaultValue: HasDefault;
  arrayOf(): Prop<As, Output[], Params, IsOmitted, HasDefault, HasOp>;
  nullable(): Prop<As, Output | null, Params, IsOmitted, HasDefault, HasOp>;
  // Because of pred function, Output | undefined
  eq<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output | undefined> | Output, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Output, Params & Params2, IsOmitted, HasDefault, true>;
  notEq: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["eq"];
  isNull<Params2 = {}>(pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Output, Params & Params2, IsOmitted, HasDefault, true>;
  notIsNull: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string | undefined> | string, pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Output, Params & Params2, IsOmitted, HasDefault, true>;
  notLike: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["like"];
  iLike: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["like"];
  notILike: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output[] | undefined> | Output[], pred?: TagFunctionVariable<Params & Params2, boolean>): Prop<As, Output, Params & Params2, IsOmitted, HasDefault, true>;
  notIn: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output | undefined> | Output, pred?: TagFunctionVariable<Params & Params2>): Prop<As, Output, Params & Params2, IsOmitted, HasDefault, true>;
  gte: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["gt"];
  lt: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["gt"];
  lte: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["gt"];
  asc(): Prop<As, Output, Params, IsOmitted, HasDefault, true>;
  desc: Prop<As, Output, Params, IsOmitted, HasDefault, HasOp>["asc"];
  operations: Operation<Params>[];
  hasOp: HasOp;
  omit(): Prop<As, Output, Params, true, HasDefault, HasOp>;
  hasDefault(): Prop<As, Output, Params, IsOmitted, true, HasOp>;
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

function Prop<As extends string>(as: As, col?: string) {
  let prop: Prop<As, any, {}, false, false, false> = Object.create (prototype);

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

Prop.isProp = function <As extends string = any, Output = any> (x: any): x is Prop {
  return x != null && x[refqlType] === type;
};

export default Prop;