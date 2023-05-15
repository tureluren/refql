import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Eq from "./Eq";
import { rqlNodePrototype } from "./isRQLNode";
import PropType from "./PropType";

interface SQLProp<As extends string = any, Type = unknown, Params = any> {
  as: As;
  col: SQLTag<Params>;
  type: Type;
  arrayOf(): SQLProp<As, Type[], Params>;
  nullable(): SQLProp<As, Type | null, Params>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Type, Params & Params2>;
  [PropType]: true;
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: SQLProp,
  [refqlType]: type,
  arrayOf: nullable,
  nullable,
  eq,
  [PropType]: true
});

function SQLProp<As extends string, Type, Params>(as: As, col: SQLTag<Params>) {
  let sqlProp: SQLProp<As, Type, Params> = Object.create (prototype);

  sqlProp.as = as;
  sqlProp.col = col;

  return sqlProp;
}

function nullable(this: SQLProp) {
  return SQLProp (this.as, this.col);
}

function eq(this: SQLProp, run: any) {
  return Eq<any> (this.col, run);
}

SQLProp.isSQLProp = function (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;