import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All extends ASTNode<unknown> {
  sign: string;
}

const allPrototype = Object.assign ({}, astNodePrototype, {
  constructor: All, cata
});

function All(sign: string) {
  let all: All = Object.create (allPrototype);

  all.sign = sign;

  return all;
}

function cata(this: All, pattern: StringMap) {
  return pattern.All (this.sign);
}

export default All;