import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import Values from "../SQLTag/Values.ts";
import Operation, { operationPrototype } from "./Operation.ts";

interface In<Params = any, Output = any> extends Operation<Params> {
  run: TagFunctionVariable<Params, Output[]> | Output[];
  notIn: boolean;
}

const type = "refql/In";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: In,
  [refqlType]: type,
  interpret
});

function In<Params, Output>(run: TagFunctionVariable<Params, Output[]> | Output[], notIn = false) {
  let whereIn: In<Params, Output> = Object.create (prototype);

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Output[]>;

  whereIn.notIn = notIn;

  return whereIn;
}

function interpret(this: In, col: Raw | SQLTag, displayAnd: boolean) {
  const { notIn, run } = this;
  const equality = notIn ? "not in" : "in";

  return sqlX`
    ${Raw (displayAnd ? "and " : "")}${col} ${Raw (equality)} ${Values (run)}
  `;
}

In.isIn = function <Params = any, Output = any> (x: any): x is In<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default In;