import Literal, { literalPrototype } from "./Literal.ts";

interface StringLiteral extends Literal {
  value: string;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral
});

function StringLiteral(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (prototype);

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

export default StringLiteral;