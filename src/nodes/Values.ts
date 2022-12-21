import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";

interface Values<Params, InRQL extends boolean = true> extends ASTNode<Params, InRQL> {
  run: TagFunctionVariable<Params, InRQL, any[]>;
}

const type = "refql/Values";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values,
  [refqlType]: type,
  caseOf
});

function Values<Params, InRQL extends boolean = true>(run: any[] | TagFunctionVariable<Params, InRQL, any[]>) {
  let values: Values<Params, InRQL> = Object.create (prototype);
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