import { refqlType } from "../common/consts.ts";
import { CastAs, StringMap } from "../common/types.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface Literal extends ASTNode<unknown>, CastAs {
  value: string | number | boolean | null;
}

const type = "refql/Literal";

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  caseOf
});

function Literal(value: string | number | boolean | null, as?: string, cast?: string) {
  let literal: Literal = Object.create (literalPrototype);

  literal.value = value;
  literal.as = as;
  literal.cast = cast;

  return literal;
}

function caseOf(this: Literal, structureMap: StringMap) {
  return structureMap.Literal (this.value, this.as, this.cast);
}

Literal.isLiteral = function (value: any): value is Literal {
  return value != null && value[refqlType] === type;
};

export default Literal;