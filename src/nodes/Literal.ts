import { refqlType } from "../common/consts";
import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal extends ASTNode<unknown>, CastAs {
  value: string | number | boolean | null;
}

const literalType = "refql/Literal";

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  caseOf,
  [refqlType]: literalType
});

function caseOf(this: Literal, structureMap: StringMap) {
  return structureMap[this.constructor.name] (this.value, this.as, this.cast);
}

export const isLiteral = function (value: any): value is Literal {
  return value != null && value[refqlType] === literalType;
};

export default Literal;