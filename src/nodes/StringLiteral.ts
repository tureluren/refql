import Literal, { literalPrototype } from "./Literal";

interface StringLiteral extends Literal {
  value: string;
}

function StringLiteral(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: StringLiteral })
  );

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

export default StringLiteral;