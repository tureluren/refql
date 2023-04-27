import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All<Params, Output> extends ASTNode<Params, Output> {
  sign: string;
}

const type = "refql/All";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: All, caseOf, [refqlType]: type
});

function All<Params, Output>(sign: string) {
  let all: All<Params, Output> = Object.create (prototype);

  all.sign = sign;

  return all;
}

function caseOf<Params, Output>(this: All<Params, Output>, structureMap: StringMap) {
  return structureMap.All (this.sign);
}

All.isAll = function <Params, Output> (x: any): x is All<Params, Output> {
  return x != null && x[refqlType] === type;
};

export const all = All ("*");

export default All;