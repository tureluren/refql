import { Boxes } from "../common/BoxRegistry";
import { CastAs, StringMap, ValueType } from "../common/types";
import SQLTag from "../SQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Variable<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box>, CastAs {
  x: SQLTag<Params, Output, Box> | ValueType;
}

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  caseOf
});

function Variable<Params, Output, Box extends Boxes>(x: SQLTag<Params, Output, Box> | ValueType, as?: string, cast?: string) {
  let variable: Variable<Params, Output, Box> = Object.create (prototype);

  variable.x = x;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function caseOf<Params, Output, Box extends Boxes>(this: Variable<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Variable (this.x, this.as, this.cast);
}

export default Variable;