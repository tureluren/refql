import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All extends ASTNode<unknown> {
  sign: string;
}

const allType = "refql/All";

const allPrototype = Object.assign ({}, astNodePrototype, {
  constructor: All, caseOf, [refqlType]: allType
});

function All(sign: string) {
  let all: All = Object.create (allPrototype);

  all.sign = sign;

  return all;
}

function caseOf(this: All, structureMap: StringMap) {
  return structureMap.All (this.sign);
}

All.isAll = function (value: any): value is All {
  return value != null && value[refqlType] === allType;
};

export const all = All ("*");

export default All;