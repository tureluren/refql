import { refqlType } from "../common/consts.ts";
import { OrdOperator, TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import Value from "../SQLTag/Value.ts";
import Operation, { operationPrototype } from "./Operation.ts";

interface Ord<Params = any, Output = any> extends Operation<Params> {
  run: TagFunctionVariable<Params, Output>;
  operator: OrdOperator;
}

const type = "refql/Ord";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: Ord,
  [refqlType]: type,
  interpret
});

function Ord<Params, Output>(run: TagFunctionVariable<Params, Output> | Output, operator: OrdOperator) {
  let ord: Ord<Params, Output> = Object.create (prototype);

  ord.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Output>;

  ord.operator = operator;

  return ord;
}

function interpret(this: Ord, col: Raw | SQLTag, displayAnd: boolean) {
  const { operator, run } = this;

  return sqlX`
    ${Raw (displayAnd ? "and " : "")}${col} ${Raw (operator)} ${Value (run)}
  `;
}

Ord.isOrd = function (x: any): x is Ord {
  return x != null && x[refqlType] === type;
};

export default Ord;