import { refqlType } from "../common/consts";
import { RQLNode, TagFunctionVariable } from "../common/types";
import Eq from "../RQLTag/Eq";
import { rqlNodePrototype } from "../RQLTag/isRQLNode";
import { SQLTag } from "../SQLTag";
import PropType from "./PropType";

interface SQLProp<As extends string = any, Params = any, Type = any> extends RQLNode {
  as: As;
  col: SQLTag<Params>;
  type: Type;
  arrayOf(): SQLProp<As, Params, Type[]>;
  nullable(): SQLProp<As, Params, Type | null>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params2, Type> | Type): Eq<As, Params & Params2, Type>;
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

SQLProp.isSQLProp = function <As extends string = any, Params = any, Type = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;