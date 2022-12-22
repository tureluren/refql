import Literal, { literalPrototype } from "./Literal";

interface NumericLiteral extends Literal {
  value: number;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: NumericLiteral
});

function NumericLiteral(value: number, as?: string, cast?: string) {
  let numericLiteral: NumericLiteral = Object.create (prototype);

  numericLiteral.value = value;
  numericLiteral.as = as;
  numericLiteral.cast = cast;

  return numericLiteral;
}

export default NumericLiteral;