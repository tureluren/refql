import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import { sqlNodePrototype } from "./isSQLNode";

interface Values<Params> {
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

Values.isValues = function <Params> (x: any): x is Values<Params> {
  return x != null && x[refqlType] === type;
};

export default Values;