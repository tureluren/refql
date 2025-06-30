import { dir, eq, isNull, like, nullable, omit, ord, whereIn } from ".";
import Operation from "../RQLTag/Operation";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
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
  notEq: SQLProp<As, Output, Params, IsOmitted, HasOp>["eq"];
  isNull<Params2 = {}>(): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notIsNull: SQLProp<As, Output, Params, IsOmitted, HasOp>["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string> | string): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notLike: SQLProp<As, Output, Params, IsOmitted, HasOp>["like"];
  iLike: SQLProp<As, Output, Params, IsOmitted, HasOp>["like"];
  notILike: SQLProp<As, Output, Params, IsOmitted, HasOp>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output[]> | Output[]): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  notIn: SQLProp<As, Output, Params, IsOmitted, HasOp>["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output> | Output): SQLProp<As, Output, Params & Params2, IsOmitted, true>;
  gte: SQLProp<As, Output, Params, IsOmitted, HasOp>["gt"];
  lt: SQLProp<As, Output, Params, IsOmitted, HasOp>["gt"];
  lte: SQLProp<As, Output, Params, IsOmitted, HasOp>["gt"];
  asc(): SQLProp<As, Output, Params, IsOmitted, true>;
  desc: SQLProp<As, Output, Params, IsOmitted, HasOp>["asc"];
  operations: Operation<Params>[];
  hasOp: HasOp;
  omit(): SQLProp<As, Output, Params, true, HasOp>;
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
  omit
});

function SQLProp<As extends string, Params = any>(as: As, col: SQLTag<Params>) {
  let prop: SQLProp<As, any, Params, false, false> = Object.create (prototype);

  prop.as = as;
  prop.col = col;
  prop.operations = [];
  prop.isOmitted = false;

  return prop;
}

SQLProp.isSQLProp = function <As extends string = any, Output = any> (x: any): x is SQLProp {
  return x != null && x[refqlType] === type;
};

export default SQLProp;