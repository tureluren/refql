import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import Eq from "../RQLTag/Eq.ts";
import In from "../RQLTag/In.ts";
import OrderBy from "../RQLTag/OrderBy.ts";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode.ts";
import { SQLTag } from "../SQLTag/index.ts";
import PropType, { propTypePrototype } from "./PropType.ts";

interface SQLProp<As extends string = any, Params = any, Type = any> extends RQLNode, PropType<As> {
  params: Params;
  col: SQLTag<Params>;
  type: Type;
  arrayOf(): SQLProp<As, Params, Type[]>;
  nullable(): SQLProp<As, Params, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params & Params2, Type>;
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): In<As, Params & Params2, Type>;
  asc(): OrderBy<As, false, Params>;
  desc(): OrderBy<As, true, Params>;
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: SQLProp,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  in: whereIn,
  asc,
  desc
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

function whereIn(this: SQLProp, run: any) {
  return In (this.col, run);
}

function asc(this: SQLProp) {
  return OrderBy (this.col, false);
}

function desc(this: SQLProp) {
  return OrderBy (this.col, true);
}

SQLProp.isSQLProp = function <As extends string = any, Params = any, Type = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;