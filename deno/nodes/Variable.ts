import { CastAs, StringMap, ValueType } from "../common/types.ts";
import SQLTag from "../SQLTag/index.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface Variable<Params = unknown, Output = unknown> extends ASTNode<Params, Output>, CastAs {
  x: SQLTag<Params, Output> | ValueType;
}

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  caseOf
});

function Variable<Params, Output>(x: SQLTag<Params, Output> | ValueType, as?: string, cast?: string) {
  let variable: Variable<Params, Output> = Object.create (prototype);

  variable.x = x;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function caseOf(this: Variable, structureMap: StringMap) {
  return structureMap.Variable (this.x, this.as, this.cast);
}

export default Variable;