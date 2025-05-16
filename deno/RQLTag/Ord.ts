import { refqlType } from "../common/consts.ts";
import { OrdOperator, TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlP } from "../SQLTag/sql.ts";
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

function Ord<Params, Output>(run: TagFunctionVariable<Params, Output> | Output, operator: OrdOperator, pred?: TagFunctionVariable<Params, boolean>) {
  let ord: Ord<Params, Output> = Object.create (prototype);

  ord.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Output>;

  ord.operator = operator;

  if (pred) {
    ord.pred = pred;
  }

  return ord;
}

function interpret(this: Ord, col: Raw | SQLTag) {
  const { operator, pred, run } = this;

  return sqlP (pred)`
    and ${col} ${Raw (operator)} ${Value (run)}
  `;
}

Ord.isOrd = function <Params = any, Output = any> (x: any): x is Ord<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Ord;