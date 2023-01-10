import { CastAs, StringMap, ValueType } from "../common/types";
import SQLTag from "../SQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Variable<Params> extends ASTNode<Params>, CastAs {
  x: SQLTag<Params> | ValueType;
}

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  caseOf
});

function Variable<Params>(x: SQLTag<Params> | ValueType, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (prototype);

  variable.x = x;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function caseOf(this: Variable<unknown>, structureMap: StringMap) {
  return structureMap.Variable (this.x, this.as, this.cast);
}

export default Variable;