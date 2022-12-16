import { CastAs, StringMap, ValueType } from "../common/types";
import SQLTag from "../SQLTag";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

// remove ?? in use ?

interface Variable<Params> extends ASTNode<Params>, CastAs {
  value: SQLTag<Params> | ValueType;
}

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  caseOf
});

function Variable<Params>(value: SQLTag<Params> | ValueType, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (prototype);

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function caseOf(this: Variable<unknown>, structureMap: StringMap) {
  return structureMap.Variable (this.value, this.as, this.cast);
}

export default Variable;