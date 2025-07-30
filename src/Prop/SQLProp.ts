import Prop, { dir, eq, isNull, like, logic, nullable, omit, ord, whereIn } from ".";
import Operation from "../RQLTag/Operation";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
import { sqlX } from "../SQLTag/sql";
import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import PropType, { propTypePrototype } from "./PropType";

interface SQLProp<As extends string = any, Output = any, Params = any, IsOmitted extends boolean = any, HasOp extends boolean = any> extends RQLNode, PropType<As> {
  params: Params;
  col: SQLTag<Params>;
  output: Output;
  isOmitted: IsOmitted;
  arrayOf(): SQLProp<As, Output[], Params, IsOmitted, HasOp>;
  nullable(): SQLProp<As, Output | null, Params, IsOmitted, HasOp>;
  eq<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output> | Output): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notEq: this["eq"];
  isNull<Params2 = {}>(): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notIsNull: this["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string> | string): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notLike: this["like"];
  iLike: this["like"];
  notILike: this["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output[]> | Output[]): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notIn: this["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output> | Output): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  gte: this["gt"];
  lt: this["gt"];
  lte: this["gt"];
  asc(): SQLProp<As, Output, Params, IsOmitted, true>;
  desc: this["asc"];
  operations: Operation<Params>[];
  hasOp: HasOp;
  omit(): SQLProp<As, Output, Params, true, HasOp>;
  or<Params2 = {}>(prop: Prop | SQLProp<any, any, Params2>): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  and: this["or"];
  interpret: () => SQLTag;
}

const type = "refql/SQLProp";

const prototype = Object.assign ({}, rqlNodePrototype, propTypePrototype, {
  constructor: SQLProp,
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
  or: logic ("or"),
  and: logic ("and"),
  interpret
});

function SQLProp<As extends string, Params = any>(as: As, col: SQLTag<Params>) {
  let prop: SQLProp<As, any, Params, false, false> = Object.create (prototype);

  prop.as = as;
  prop.col = col;
  prop.operations = [];
  prop.isOmitted = false;

  return prop;
}

function interpret(this: SQLProp) {
  return sqlX`(${this.col})`;
}

SQLProp.isSQLProp = function (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;