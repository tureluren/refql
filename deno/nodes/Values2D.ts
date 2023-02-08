import { refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import { ASTNode } from "../nodes/index.ts";
import { astNodePrototype } from "../nodes/ASTNode.ts";

interface Values2D<Params = unknown> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, ValueType[][]>;
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values2D,
  [refqlType]: type,
  caseOf
});

function Values2D<Params>(run: ValueType[][] | TagFunctionVariable<Params, any[][]>) {
  let values2D: Values2D<Params> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

function caseOf(this: Values2D, structureMap: StringMap) {
  return structureMap.Values2D (this.run);
}

Values2D.isValues2D = function <Params> (x: any): x is Values2D<Params> {
  return x != null && x[refqlType] === type;
};

export default Values2D;