import { CastAs, RefQLValue, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Variable<Params> extends ASTNode<Params>, CastAs {
  value: RefQLValue<Params>;
}

const variablePrototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  caseOf
});

function Variable<Params>(value: RefQLValue<Params>, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (variablePrototype);

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function caseOf(this: Variable<unknown>, structureMap: StringMap, params: unknown, table: Table) {
  const ran = typeof this.value === "function"
    ? this.value (params, table)
    : this.value;

  return structureMap.Variable (ran, this.as, this.cast);
}

export default Variable;