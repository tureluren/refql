import { StringMap } from "../common/types";
import Literal, { literalPrototype } from "./Literal";

interface StringLiteral<Params, Output> extends Literal<Params, Output> {
  x: string;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral,
  caseOf
});

function StringLiteral<Params, Output>(x: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral<Params, Output> = Object.create (prototype);

  stringLiteral.x = x;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

function caseOf<Params, Output>(this: StringLiteral<Params, Output>, structureMap: StringMap) {
  return structureMap.StringLiteral (this.x, this.as, this.cast);
}

export default StringLiteral;