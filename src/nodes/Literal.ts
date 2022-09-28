import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal extends ASTNode<unknown>, CastAs {
  value: string | number | boolean | null;
}

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  caseOf
});

function caseOf(this: Literal, structureMap: StringMap) {
  return structureMap[this.constructor.name] (this.value, this.as, this.cast);
}

export default Literal;