import { refqlType } from "../common/consts.ts";
import { Boxes } from "../common/BoxRegistry.ts";
import { StringMap, TagFunctionVariable } from "../common/types.ts";
import SQLTag from "../SQLTag/index.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface When<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  pred: TagFunctionVariable<Params, Box, boolean>;
  tag: SQLTag<Params, Output, Box>;
}

const type = "refql/When";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: When,
  [refqlType]: type,
  caseOf
});

function When<Params, Output, Box extends Boxes>(pred: TagFunctionVariable<Params, Box, boolean>, tag: SQLTag<Params, Output, Box>) {
  let when: When<Params, Output, Box> = Object.create (prototype);

  when.pred = pred;
  when.tag = tag;

  return when;
}

function caseOf<Params, Output, Box extends Boxes>(this: When<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.When (this.pred, this.tag);
}

When.isWhen = function <Params, Output, Box extends Boxes> (x: any): x is When<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default When;