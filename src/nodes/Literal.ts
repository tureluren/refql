import { refqlType } from "../common/consts";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal<Params, Output> extends ASTNode<Params, Output>, CastAs {
  x: string | number | boolean | null;
}

const type = "refql/Literal";

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  caseOf
});

function Literal<Params, Output>(x: string | number | boolean | null, as?: string, cast?: string) {
  let literal: Literal<Params, Output> = Object.create (literalPrototype);

  literal.x = x;
  literal.as = as;
  literal.cast = cast;

  return literal;
}

function caseOf<Params, Output>(this: Literal<Params, Output>, structureMap: StringMap) {
  return structureMap.Literal (this.x, this.as, this.cast);
}

Literal.isLiteral = function <Params, Output> (x: any): x is Literal<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Literal;