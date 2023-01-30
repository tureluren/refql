import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Value<Params> extends ASTNode<Params, unknown> {
  run: TagFunctionVariable<Params>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Value, caseOf, [refqlType]: type
});

function Value<Params>(run: ValueType | TagFunctionVariable<Params>) {
  let value: Value<Params> = Object.create (prototype);

  value.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return value;
}

function caseOf(this: Value<unknown>, structureMap: StringMap) {
  return structureMap.Value (this.run);
}

Value.isValue = function (x: any): x is Value<unknown> {
  return x != null && x[refqlType] === type;
};

export default Value;