import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Values from "../SQLTag/Values";
import Operation, { operationPrototype } from "./Operation";

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