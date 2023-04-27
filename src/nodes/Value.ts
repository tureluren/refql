import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Value<Params, Output> extends ASTNode<Params, Output> {
  run: TagFunctionVariable<Params>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Value, caseOf, [refqlType]: type
});

function Value<Params, Output>(run: ValueType | TagFunctionVariable<Params>) {
  let value: Value<Params, Output> = Object.create (prototype);

  value.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return value;
}

function caseOf<Params, Output>(this: Value<Params, Output>, structureMap: StringMap) {
  return structureMap.Value (this.run);
}

Value.isValue = function<Params, Output> (x: any): x is Value<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Value;