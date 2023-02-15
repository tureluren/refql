import { Boxes } from "../common/BoxRegistry.ts";
import { StringMap } from "../common/types.ts";
import Literal, { literalPrototype } from "./Literal.ts";

interface StringLiteral<Params, Output, Box extends Boxes> extends Literal<Params, Output, Box> {
  x: string;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral,
  caseOf
});

function StringLiteral<Params, Output, Box extends Boxes>(x: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral<Params, Output, Box> = Object.create (prototype);

  stringLiteral.x = x;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

function caseOf<Params, Output, Box extends Boxes>(this: StringLiteral<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.StringLiteral (this.x, this.as, this.cast);
}

export default StringLiteral;