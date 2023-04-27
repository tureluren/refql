import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import { ASTNode } from "../nodes";
import { astNodePrototype } from "../nodes/ASTNode";

interface Values2D<Params, Output> extends ASTNode<Params, Output> {
  run: TagFunctionVariable<Params, ValueType[][]>;
}

const type = "refql/Values2D";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Values2D,
  [refqlType]: type,
  caseOf
});

function Values2D<Params, Output>(run: ValueType[][] | TagFunctionVariable<Params, any[][]>) {
  let values2D: Values2D<Params, Output> = Object.create (prototype);
  values2D.run = typeof run === "function" ? run : () => run;

  return values2D;
}

function caseOf<Params, Output>(this: Values2D<Params, Output>, structureMap: StringMap) {
  return structureMap.Values2D (this.run);
}

Values2D.isValues2D = function <Params, Output> (x: any): x is Values2D<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Values2D;