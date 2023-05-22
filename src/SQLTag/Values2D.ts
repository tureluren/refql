import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import SQLNode, { sqlNodePrototype } from "./SQLNode";

interface Values2D<Params = any> extends SQLNode<Params> {
  run: TagFunctionVariable<Params, ValueType[][]>;
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

Values2D.isValues2D = function <Params = any> (x: any): x is Values2D<Params> {
  return x != null && x[refqlType] === type;
};

export default Values2D;