import { refqlType } from "../common/consts";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal extends ASTNode<unknown>, CastAs {
  x: string | number | boolean | null;
}

const type = "refql/Literal";

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  caseOf
});

function Literal(x: string | number | boolean | null, as?: string, cast?: string) {
  let literal: Literal = Object.create (literalPrototype);

  literal.x = x;
  literal.as = as;
  literal.cast = cast;

  return literal;
}

function caseOf(this: Literal, structureMap: StringMap) {
  return structureMap.Literal (this.x, this.as, this.cast);
}

Literal.isLiteral = function (x: any): x is Literal {
  return x != null && x[refqlType] === type;
};

export default Literal;