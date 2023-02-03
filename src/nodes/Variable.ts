import { CastAs, StringMap, ValueType } from "../common/types";
import SQLTag from "../SQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

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