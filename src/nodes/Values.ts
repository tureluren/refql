import { refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";

interface Values<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  run: TagFunctionVariable<Params, Box, ValueType[]>;
}

const type = "refql/Values";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values,
  [refqlType]: type,
  caseOf
});

function Values<Params, Output, Box extends Boxes>(run: ValueType[] | TagFunctionVariable<Params, Box, any[]>) {
  let values: Values<Params, Output, Box> = Object.create (prototype);
  values.run = typeof run === "function" ? run : () => run;

  return values;
}

function caseOf<Params, Output, Box extends Boxes>(this: Values<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Values (this.run);
}

Values.isValues = function <Params, Output, Box extends Boxes> (x: any): x is Values<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Values;