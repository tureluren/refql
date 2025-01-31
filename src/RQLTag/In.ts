import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP } from "../SQLTag/sql";
import Values from "../SQLTag/Values";
import Operation, { operationPrototype } from "./Operation";

interface In<Params = any, Type = any> extends Operation<Params> {
  run: TagFunctionVariable<Params, Type[]> | Type[];
  notIn: boolean;
}

const type = "refql/In";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: In,
  [refqlType]: type,
  interpret
});

function In<Params, Type>(run: TagFunctionVariable<Params, Type[]> | Type[], pred?: TagFunctionVariable<Params, boolean>, notIn = false) {
  let whereIn: In<Params, Type> = Object.create (prototype);

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type[]>;

  if (pred) {
    whereIn.pred = pred;
  }

  whereIn.notIn = notIn;

  return whereIn;
}

function interpret(this: In, col: Raw | SQLTag) {
  const { notIn, pred, run } = this;
  const equality = notIn ? "not in" : "in";

  return sqlP (pred)`
    and ${col} ${Raw (equality)} ${Values (run)}
  `;
}

In.isIn = function <Params = any, Type = any> (x: any): x is In<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default In;