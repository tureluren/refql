import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All extends ASTNode<unknown, unknown> {
  sign: string;
}

const type = "refql/All";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: All, caseOf, [refqlType]: type
});

function All(sign: string) {
  let all: All = Object.create (prototype);

  all.sign = sign;

  return all;
}

function caseOf(this: All, structureMap: StringMap) {
  return structureMap.All (this.sign);
}

All.isAll = function (x: any): x is All {
  return x != null && x[refqlType] === type;
};

export const all = All ("*");

export default All;