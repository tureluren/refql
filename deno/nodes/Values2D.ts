import { refqlType } from "../common/consts.ts";
import { Boxes } from "../common/BoxRegistry.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import { ASTNode } from "../nodes/index.ts";
import { astNodePrototype } from "../nodes/ASTNode.ts";

interface Values2D<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  run: TagFunctionVariable<Params, Box, ValueType[][]>;
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values2D,
  [refqlType]: type,
  caseOf
});

function Values2D<Params, Output, Box extends Boxes>(run: ValueType[][] | TagFunctionVariable<Params, Box, any[][]>) {
  let values2D: Values2D<Params, Output, Box> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

function caseOf<Params, Output, Box extends Boxes>(this: Values2D<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Values2D (this.run);
}

Values2D.isValues2D = function <Params, Output, Box extends Boxes> (x: any): x is Values2D<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Values2D;