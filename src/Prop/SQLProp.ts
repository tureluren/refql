import { refqlType } from "../common/consts";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
import IsNull from "../RQLTag/IsNull";
import Like from "../RQLTag/Like";
import Ord from "../RQLTag/Ord";
import OrderBy from "../RQLTag/OrderBy";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
import Operation from "../Table/Operation";
import PropType, { propTypePrototype } from "./PropType";

interface SQLProp<As extends string = any, Params = any, Type = any> extends RQLNode, PropType<As> {
  params: Params;
  col: SQLTag<Params>;
  type: Type;
  arrayOf(): SQLProp<As, Params, Type[]>;
  nullable(): SQLProp<As, Params, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): SQLProp<As, Params & Params2, Type>;
  isNull<Params2 = {}>(): SQLProp<As, Params & Params2, Type>;
  like<Params2 = {}>(run: TagFunctionVariable<Params2, string> | string): SQLProp<As, Params & Params2>;
  iLike: SQLProp<As, Params, Type>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): SQLProp<As, Params & Params2, Type>;
  gt<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): SQLProp<As, Params & Params2, Type>;
  gte: SQLProp<As, Params, Type>["gt"];
  lt: SQLProp<As, Params, Type>["gt"];
  lte: SQLProp<As, Params, Type>["gt"];
  asc(): SQLProp<As, Params, Type>;
  desc: SQLProp<As, Params, Type>["asc"];
  operations: Operation<Params>[];
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: SQLProp,
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

function SQLProp<As extends string, Params, Type = any>(as: As, col: SQLTag<Params>) {
  let sqlProp: SQLProp<As, Params, Type> = Object.create (prototype);

  sqlProp.as = as;
  sqlProp.col = col;
  sqlProp.operations = [];

  return sqlProp;
}

function nullable(this: SQLProp) {
  return SQLProp (this.as, this.col);
}

function eq(this: SQLProp, run: any) {
  const prop = SQLProp (this.as, this.col);
  const eqOp = Eq (prop.col, run);

  prop.operations = this.operations.concat (eqOp);

  return prop;
}

function isNull(this: SQLProp) {
  const prop = SQLProp (this.as, this.col);
  const nullOp = IsNull (prop.col);

  prop.operations = this.operations.concat (nullOp);

  return prop;
}

function like(caseSensitive?: boolean) {
  return function (this: SQLProp, run: any) {
    const prop = SQLProp (this.as, this.col);
    const likeOp = Like (prop.col, run, caseSensitive);

    prop.operations = this.operations.concat (likeOp);

    return prop;
  };
}

function whereIn(this: SQLProp, run: any) {
  const prop = SQLProp (this.as, this.col);
  const inOp = In (prop.col, run);

  prop.operations = this.operations.concat (inOp);

  return prop;
}

function ord(operator: OrdOperator) {
  return function (this: SQLProp, run: any) {
    const prop = SQLProp (this.as, this.col);
    const ordOp = Ord (prop.col, run, operator);

    prop.operations = this.operations.concat (ordOp);

    return prop;
  };
}

function dir(descending?: boolean) {
  return function (this: SQLProp) {
    const prop = SQLProp (this.as, this.col);
    const orderByOp = OrderBy (prop.col, descending);

    prop.operations = this.operations.concat (orderByOp);

    return prop;
  };
}

SQLProp.isSQLProp = function <As extends string = any, Params = any, Type = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;