import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import SQLNode, { sqlNodePrototype } from "./SQLNode";

interface Values<Params = any> extends SQLNode<Params> {
  run: TagFunctionVariable<Params, ValueType[]>;
  setPred (fn: TagFunctionVariable<Params, boolean>): Values<Params>;
}

const type = "refql/Values";

const prototype = Object.assign ({}, sqlNodePrototype, {
  constructor: Values,
  [refqlType]: type
});

function Values<Params>(run: ValueType[] | TagFunctionVariable<Params, any[]>) {
  let values: Values<Params> = Object.create (prototype);
  values.run = typeof run === "function" ? run : () => run;

  return values;
}

Values.isValues = function <Params = any> (x: any): x is Values<Params> {
  return x != null && x[refqlType] === type;
};

export default Values;