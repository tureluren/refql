import { StringMap } from "../common/types";
import Literal, { literalPrototype } from "./Literal";

interface StringLiteral extends Literal {
  value: string;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral,
  caseOf
});

function StringLiteral(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (prototype);

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

function caseOf(this: StringLiteral, structureMap: StringMap) {
  return structureMap.StringLiteral (this.value, this.as, this.cast);
}

export default StringLiteral;