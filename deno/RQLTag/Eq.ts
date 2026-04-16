import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
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

function Eq<Params, Output>(run: TagFunctionVariable<Params, Output> | Output, notEq = false) {
  let eq: Eq<Params, Output> = Object.create (prototype);

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Output>;

  eq.notEq = notEq;

  return eq;
}

function interpret(this: Eq, col: Raw | SQLTag, displayAnd: boolean) {
  const { notEq, run } = this;
  const equality = notEq ? "!=" : "=";

  return sqlX`
    ${Raw (displayAnd ? "and " : "")}${col} ${Raw (equality)} ${run}
  `;
}

Eq.isEq = function (x: any): x is Eq {
  return x != null && x[refqlType] === type;
};

export default Eq;