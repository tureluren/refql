import { refqlType } from "../common/consts";
import { CastAs, TagFunctionVariable, StringMap, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Value<Params, InRQL extends boolean = true> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, InRQL>;
}

const type = "refql/Value";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Value, caseOf, [refqlType]: type
});

function Value<Params, InRQL extends boolean = true>(run: ValueType | TagFunctionVariable<Params, InRQL>): Value<Params, InRQL> {
  let value: Value<Params, InRQL> = Object.create (prototype);
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