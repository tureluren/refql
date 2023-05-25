import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import SQLNode, { sqlNodePrototype } from "../SQLTag/SQLNode";

interface When2<Params = any> extends SQLNode<Params> {
  params: Params;
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params>;
}

const type = "refql/When2";

const prototype = Object.assign ({}, sqlNodePrototype, {
  constructor: When2,
  [refqlType]: type
});

// Params is inferred from type of `tag` parameter, so no need to default it to any
function When2<Params>(pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params>) {
  let when2: When2<Params> = Object.create (prototype);

  when2.pred = pred;
  when2.tag = tag;

  return when2;
}

When2.isWhen2 = function <Params = any> (x: any): x is When2<Params> {
  return x != null && x[refqlType] === type;
};

export default When2;