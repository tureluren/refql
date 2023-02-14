import { refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box>, CastAs {
  x: string | number | boolean | null;
}

const type = "refql/Literal";

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  caseOf
});

function Literal<Params, Output, Box extends Boxes>(x: string | number | boolean | null, as?: string, cast?: string) {
  let literal: Literal<Params, Output, Box> = Object.create (literalPrototype);

  literal.x = x;
  literal.as = as;
  literal.cast = cast;

  return literal;
}

function caseOf<Params, Output, Box extends Boxes>(this: Literal<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Literal (this.x, this.as, this.cast);
}

Literal.isLiteral = function <Params, Output, Box extends Boxes> (x: any): x is Literal<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Literal;