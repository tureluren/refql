import { CastAs, RefQLValue, StringMap } from "../common/types";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Variable<Params> extends ASTNode<Params>, CastAs {
  value: RefQLValue<Params>;
}

const variablePrototype = Object.assign ({}, astNodePrototype, {
  constructor: Variable,
  cata
});

function Variable<Params>(value: RefQLValue<Params>, as?: string, cast?: string) {
  let variable: Variable<Params> = Object.create (variablePrototype);

  variable.value = value;
  variable.as = as;
  variable.cast = cast;

  return variable;
}

function cata(this: Variable<unknown>, pattern: StringMap, params: unknown, table: Table) {
  const ran = typeof this.value === "function"
    ? this.value (params, table)
    : this.value;

  return pattern.Variable (ran, this.as, this.cast);
}

export default Variable;