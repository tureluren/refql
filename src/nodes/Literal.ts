import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Literal extends ASTNode<unknown>, CastAs {
  value: string | number | boolean | null;
}

export const literalPrototype = Object.assign ({}, astNodePrototype, {
  cata
});

function cata(this: Literal, pattern: StringMap) {
  return pattern[this.constructor.name] (this.value, this.as, this.cast);
}

export default Literal;