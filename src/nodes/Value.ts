import { refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import { sqlNodePrototype } from "./isSQLNode";

interface Value<Params> {
  run: TagFunctionVariable<Params>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, sqlNodePrototype, {
  constructor: Value,
  [refqlType]: type
});

function Value<Params>(run: ValueType | TagFunctionVariable<Params>) {
  let value: Value<Params> = Object.create (prototype);

  value.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return value;
}

Value.isValue = function<Params> (x: any): x is Value<Params> {
  return x != null && x[refqlType] === type;
};

export default Value;