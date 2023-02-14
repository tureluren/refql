import { refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Value<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  run: TagFunctionVariable<Params, Box>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Value, caseOf, [refqlType]: type
});

function Value<Params, Output, Box extends Boxes>(run: ValueType | TagFunctionVariable<Params, Box>) {
  let value: Value<Params, Output, Box> = Object.create (prototype);

  value.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Box>;

  return value;
}

function caseOf<Params, Output, Box extends Boxes>(this: Value<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Value (this.run);
}

Value.isValue = function<Params, Output, Box extends Boxes> (x: any): x is Value<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Value;