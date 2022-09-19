import Literal, { literalPrototype } from "./Literal";

interface BooleanLiteral extends Literal {
  value: boolean;
}

function BooleanLiteral(value: boolean, as?: string, cast?: string) {
  let booleanLiteral: BooleanLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: BooleanLiteral })
  );

  booleanLiteral.value = value;
  booleanLiteral.as = as;
  booleanLiteral.cast = cast;

  return booleanLiteral;
}

export default BooleanLiteral;