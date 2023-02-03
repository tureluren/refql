import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable } from "../common/types";
import SQLTag from "../SQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

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