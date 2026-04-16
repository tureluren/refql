import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable, ValueType } from "../common/types.ts";
import Raw from "./Raw.ts";
import SQLNode, { sqlNodePrototype } from "./SQLNode.ts";

interface Values2D<Params = any> extends SQLNode<Params> {
  run: TagFunctionVariable<Params, (ValueType | Raw)[][]>;
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, sqlNodePrototype, {
  constructor: Values2D,
  [refqlType]: type
});

function Values2D<Params>(run: ValueType[][] | TagFunctionVariable<Params, any[][]>) {
  let values2D: Values2D<Params> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

Values2D.isValues2D = function (x: any): x is Values2D {
  return x != null && x[refqlType] === type;
};

export default Values2D;