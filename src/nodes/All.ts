import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All extends ASTNode<unknown> {
  sign: string;
}

const allPrototype = Object.assign ({}, astNodePrototype, {
  constructor: All, caseOf
});

function All(sign: string) {
  let all: All = Object.create (allPrototype);

  all.sign = sign;

  return all;
}

function caseOf(this: All, structureMap: StringMap) {
  return structureMap.All (this.sign);
}

export default All;