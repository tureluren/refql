import { refqlType } from "../common/consts";
import { CastAs, TagFunctionVariable, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Value<Params> extends ASTNode<Params> {
  run: TagFunctionVariable<Params>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Value, caseOf, [refqlType]: type
});

function Value<Params>(run: any | TagFunctionVariable<Params>) {
  let value: Value<Params> = Object.create (prototype);
  value.run = typeof run === "function" ? run : () => run;

  return value;
}

function caseOf(this: Value<unknown>, structureMap: StringMap) {
  return structureMap.Value (this.run);
}

// Param.isParam = function (value: any): value is Identifier {
//   return value != null && value[refqlType] === type;
// };

export default Value;