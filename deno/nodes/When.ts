import { refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable } from "../common/types.ts";
import SQLTag from "../SQLTag/index.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";

interface When<Params = unknown, Output = unknown> extends ASTNode<Params, Output> {
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params, Output>;
}

const type = "refql/When";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: When,
  [refqlType]: type,
  caseOf
});

function When<Params, Output>(pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params, Output>) {
  let when: When<Params, Output> = Object.create (prototype);

  when.pred = pred;
  when.tag = tag;

  return when;
}

function caseOf(this: When, structureMap: StringMap) {
  return structureMap.When (this.pred, this.tag);
}

When.isWhen = function <Params, Output> (x: any): x is When<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default When;