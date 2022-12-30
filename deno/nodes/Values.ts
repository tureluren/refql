import { refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import { ASTNode } from "../nodes/index.ts";
import { astNodePrototype } from "../nodes/ASTNode.ts";

interface Values<Params> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, ValueType[]>;
}

const type = "refql/Values";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values,
  [refqlType]: type,
  caseOf
});

function Values<Params>(run: ValueType[] | TagFunctionVariable<Params, any[]>) {
  let values: Values<Params> = Object.create (prototype);
  values.run = typeof run === "function" ? run : () => run;

  return values;
}

function caseOf(this: Values<unknown>, structureMap: StringMap) {
  return structureMap.Values (this.run);
}

Values.isValues = function <Params> (value: any): value is Values<Params> {
  return value != null && value[refqlType] === type;
};

export default Values;