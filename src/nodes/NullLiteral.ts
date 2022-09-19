import Literal, { literalPrototype } from "./Literal";

interface NullLiteral extends Literal {
  value: null;
}

function NullLiteral(value: null, as?: string, cast?: string) {
  let nullLiteral: NullLiteral = Object.create (
    Object.assign ({}, literalPrototype, { constructor: NullLiteral })
  );

  nullLiteral.value = value;
  nullLiteral.as = as;
  nullLiteral.cast = cast;

  return nullLiteral;
}

export default NullLiteral;