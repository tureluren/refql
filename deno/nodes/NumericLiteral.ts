import Literal, { literalPrototype } from "./Literal.ts";

interface NumericLiteral extends Literal {
  value: number;
}

function NumericLiteral(value: number, as?: string, cast?: string) {
  let numericLiteral: NumericLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: NumericLiteral })
  );

  numericLiteral.value = value;
  numericLiteral.as = as;
  numericLiteral.cast = cast;

  return numericLiteral;
}

export default NumericLiteral;