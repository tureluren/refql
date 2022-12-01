import Literal, { literalPrototype } from "./Literal";

interface BooleanLiteral extends Literal {
  value: boolean;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: BooleanLiteral
});

function BooleanLiteral(value: boolean, as?: string, cast?: string) {
  let booleanLiteral: BooleanLiteral = Object.create (prototype);

  booleanLiteral.value = value;
  booleanLiteral.as = as;
  booleanLiteral.cast = cast;

  return booleanLiteral;
}

export default BooleanLiteral;