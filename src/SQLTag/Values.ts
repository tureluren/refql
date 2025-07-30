import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import SQLNode, { sqlNodePrototype } from "./SQLNode";

interface Values<Params = any> extends SQLNode<Params> {
  run: TagFunctionVariable<Params, ValueType[]>;
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

Values.isValues = function (x: any): x is Values {
  return x != null && x[refqlType] === type;
};

export default Values;