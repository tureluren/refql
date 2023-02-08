import { refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface Value<Params = unknown> extends ASTNode<Params> {
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

function caseOf(this: Value, structureMap: StringMap) {
  return structureMap.Value (this.run);
}

Value.isValue = function<Params> (x: any): x is Value<Params> {
  return x != null && x[refqlType] === type;
};

export default Value;