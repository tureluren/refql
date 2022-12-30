import { refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable } from "../common/types";
import SQLTag from "../SQLTag";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface When<Params> extends ASTNode<Params> {
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params>;
}

const type = "refql/When";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: When,
  [refqlType]: type,
  caseOf
});

function When<Params>(pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params>) {
  let when: When<Params> = Object.create (prototype);

  when.pred = pred;
  when.tag = tag;

  return when;
}

function caseOf(this: When<unknown>, structureMap: StringMap) {
  return structureMap.When (this.pred, this.tag);
}

When.isWhen = function <Params> (value: any): value is When<Params> {
  return value != null && value[refqlType] === type;
};

export default When;