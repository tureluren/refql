import { refqlType } from "../common/consts";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import Like from "../RQLTag/Like";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
import PropType, { propTypePrototype } from "./PropType";

interface SQLProp<As extends string = any, Params = any, Type = any> extends RQLNode, PropType<As> {
  params: Params;
  col: SQLTag<Params>;
  type: Type;
  arrayOf(): SQLProp<As, Params, Type[]>;
  nullable(): SQLProp<As, Params, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params & Params2, Type>;
  like<Params2 = {}>(run: TagFunctionVariable<Params2, string> | string): Like<As, Params & Params2>;
  iLike: SQLProp<As, Params, Type>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): In<As, Params & Params2, Type>;
  gt<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params & Params2, Type>;
  gte: SQLProp<As, Params, Type>["gt"];
  lt: SQLProp<As, Params, Type>["gt"];
  lte: SQLProp<As, Params, Type>["gt"];
  asc(): OrderBy<As, Params>;
  desc: SQLProp<As, Params, Type>["asc"];
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: SQLProp,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
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

function SQLProp<As extends string, Params, Type = any>(as: As, col: SQLTag<Params>) {
  let sqlProp: SQLProp<As, Params, Type> = Object.create (prototype);

  sqlProp.as = as;
  sqlProp.col = col;

  return sqlProp;
}

function nullable(this: SQLProp) {
  return SQLProp (this.as, this.col);
}

function eq(this: SQLProp, run: any) {
  return Eq (this.col, run);
}

function like(caseSensitive?: boolean) {
  return function (this: SQLProp, run: any) {
    return Like (this.col, run, caseSensitive);
  };
}

function whereIn(this: SQLProp, run: any) {
  return In (this.col, run);
}

function ord(operator: OrdOperator) {
  return function (this: SQLProp, run: any) {
    return Ord (this.col, run, operator);
  };
}

function dir(descending?: boolean) {
  return function (this: SQLProp) {
    return OrderBy (this.col, descending);
  };
}

SQLProp.isSQLProp = function <As extends string = any, Params = any, Type = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;