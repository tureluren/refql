import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import { sqlNodePrototype } from "./isSQLNode";

interface Values2D<Params = any> {
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

Values2D.isValues2D = function <Params> (x: any): x is Values2D<Params> {
  return x != null && x[refqlType] === type;
};

export const values2D = <Params>(run: ValueType[][] | TagFunctionVariable<Params, any[][]>) =>
  Values2D (run);

export default Values2D;