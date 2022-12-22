import Literal, { literalPrototype } from "./Literal.ts";

interface NullLiteral extends Literal {
  value: null;
}

const prototype = Object.assign ({}, literalPrototype, {
  constructor: NullLiteral
});

function NullLiteral(value: null, as?: string, cast?: string) {
  let nullLiteral: NullLiteral = Object.create (prototype);

  nullLiteral.value = value;
  nullLiteral.as = as;
  nullLiteral.cast = cast;

  return nullLiteral;
}

export default NullLiteral;