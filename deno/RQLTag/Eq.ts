import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlP } from "../SQLTag/sql.ts";
import Operation, { operationPrototype } from "./Operation.ts";

interface Eq<Params = any, Output = any> extends Operation<Params> {
  run: TagFunctionVariable<Params, Output> | Output;
  notEq: boolean;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: Eq,
  [refqlType]: type,
  interpret
});

function Eq<Params, Output>(run: TagFunctionVariable<Params, Output> | Output, pred?: TagFunctionVariable<Params, boolean>, notEq = false) {
  let eq: Eq<Params, Output> = Object.create (prototype);

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Output>;

  if (pred) {
    eq.pred = pred;
  }

  eq.notEq = notEq;

  return eq;
}

function interpret(this: Eq, col: Raw | SQLTag) {
  const { notEq, pred, run } = this;
  const equality = notEq ? "!=" : "=";

  return sqlP (pred)`
    and ${col} ${Raw (equality)} ${run}
  `;
}

Eq.isEq = function <Params = any, Output = any> (x: any): x is Eq<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Eq;