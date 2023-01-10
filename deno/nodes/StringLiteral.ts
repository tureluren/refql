import { StringMap } from "../common/types.ts";
import Literal, { literalPrototype } from "./Literal.ts";

interface StringLiteral extends Literal {
  x: string;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral,
  caseOf
});

function StringLiteral(x: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (prototype);

  stringLiteral.x = x;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

function caseOf(this: StringLiteral, structureMap: StringMap) {
  return structureMap.StringLiteral (this.x, this.as, this.cast);
}

export default StringLiteral;