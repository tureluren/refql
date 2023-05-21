import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import In from "../RQLTag/In";
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
  in<Params2 = {}>(run: TagFunctionVariable<Params2, Type[]> | Type[]): In<As, Params & Params2, Type>;
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: SQLProp,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  in: whereIn
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

SQLProp.isSQLProp = function <As extends string = any, Params = any, Type = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;