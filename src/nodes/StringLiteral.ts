import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Literal, { literalPrototype } from "./Literal";

interface StringLiteral extends Literal {
  value: string;
}

const type = "refql/StringLiteral";

const prototype = Object.assign ({}, literalPrototype, {
  constructor: StringLiteral,
  [refqlType]: type,
  caseOf
});

function StringLiteral(value: string, as?: string, cast?: string) {
  let stringLiteral: StringLiteral = Object.create (prototype);

  stringLiteral.value = value;
  stringLiteral.as = as;
  stringLiteral.cast = cast;

  return stringLiteral;
}

function caseOf(this: StringLiteral, structureMap: StringMap) {
  return structureMap.StringLiteral (this.value, this.as, this.cast);
}

StringLiteral.isStringLiteral = function (value: any): value is StringLiteral {
  return value != null && value[refqlType] === type;
};

export default StringLiteral;