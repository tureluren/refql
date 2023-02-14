import { refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface All<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  sign: string;
}

const type = "refql/All";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: All, caseOf, [refqlType]: type
});

function All<Params, Output, Box extends Boxes>(sign: string) {
  let all: All<Params, Output, Box> = Object.create (prototype);

  all.sign = sign;

  return all;
}

function caseOf<Params, Output, Box extends Boxes>(this: All<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.All (this.sign);
}

All.isAll = function <Params, Output, Box extends Boxes> (x: any): x is All<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export const all = All ("*");

export default All;