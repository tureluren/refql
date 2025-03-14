import { dir, eq, isNull, like, nullable, omit, ord, whereIn } from ".";
import Operation from "../RQLTag/Operation";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import { SQLTag } from "../SQLTag";
import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import PropType, { propTypePrototype } from "./PropType";

interface SQLProp<As extends string = any, Output = any, Params = any, IsOmitted extends boolean = any> extends RQLNode, PropType<As> {
  params: Params;
  col: SQLTag<Params>;
  output: Output;
  isOmitted: IsOmitted;
  arrayOf(): SQLProp<As, Output[], Params, IsOmitted>;
  nullable(): SQLProp<As, Output | null, Params, IsOmitted>;
  // Because of pred function, Output | undefined
  eq<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output | undefined> | Output, pred?: TagFunctionVariable<Params & Params2, boolean>): SQLProp<As, Output, Params & Params2, IsOmitted>;
  notEq: SQLProp<As, Output, Params, IsOmitted>["eq"];
  isNull<Params2 = {}>(pred?: TagFunctionVariable<Params & Params2, boolean>): SQLProp<As, Output, Params & Params2, IsOmitted>;
  notIsNull: SQLProp<As, Output, Params, IsOmitted>["isNull"];
  like<Params2 = {}>(run: TagFunctionVariable<Params & Params2, string | undefined> | string, pred?: TagFunctionVariable<Params & Params2, boolean>): SQLProp<As, Output, Params & Params2, IsOmitted>;
  notLike: SQLProp<As, Output, Params, IsOmitted>["like"];
  iLike: SQLProp<As, Output, Params, IsOmitted>["like"];
  notILike: SQLProp<As, Output, Params, IsOmitted>["like"];
  in<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output[] | undefined> | Output[], pred?: TagFunctionVariable<Params & Params2, boolean>): SQLProp<As, Output, Params & Params2, IsOmitted>;
  notIn: SQLProp<As, Output, Params, IsOmitted>["in"];
  gt<Params2 = {}>(run: TagFunctionVariable<Params & Params2, Output | undefined> | Output, pred?: TagFunctionVariable<Params & Params2>): SQLProp<As, Output, Params & Params2, IsOmitted>;
  gte: SQLProp<As, Output, Params, IsOmitted>["gt"];
  lt: SQLProp<As, Output, Params, IsOmitted>["gt"];
  lte: SQLProp<As, Output, Params, IsOmitted>["gt"];
  asc(): SQLProp<As, Output, Params, IsOmitted>;
  desc: SQLProp<As, Output, Params, IsOmitted>["asc"];
  operations: Operation<Params>[];
  omit(): SQLProp<As, Output, Params, true>;
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

function SQLProp<As extends string, Output = any, Params = any>(as: As, col: SQLTag<Params>) {
  let prop: SQLProp<As, Output, Params> = Object.create (prototype);

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