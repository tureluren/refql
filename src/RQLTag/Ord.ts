import { refqlType } from "../common/consts";
import { OrdOperator, TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Value from "../SQLTag/Value";
import Operation, { operationPrototype } from "./Operation";

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

Ord.isOrd = function <Params = any, Output = any> (x: any): x is Ord<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Ord;