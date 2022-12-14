import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";

interface Values2D<Params, InRQL extends boolean = false> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, InRQL, any[][]>;
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values2D,
  [refqlType]: type,
  caseOf
});

function Values2D<Params, InRQL extends boolean = false>(run: any[][] | TagFunctionVariable<Params, InRQL, any[][]>) {
  let values2D: Values2D<Params, InRQL> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

function caseOf(this: Values2D<unknown>, structureMap: StringMap) {
  return structureMap.Values2D (this.run);
}

Values2D.isValues2D = function <Params> (value: any): value is Values2D<Params> {
  return value != null && value[refqlType] === type;
};

export default Values2D;