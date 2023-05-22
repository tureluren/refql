import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SQLNode, { sqlNodePrototype } from "../SQLTag/SQLNode.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";

interface When<Params = any> extends RQLNode, SQLNode<Params>, SelectableType {
  params: Params;
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params>;
  whenable: true;
}

const type = "refql/When";

const prototype = Object.assign ({}, sqlNodePrototype, rqlNodePrototype, selectableTypePrototype, {
  constructor: When,
  [refqlType]: type
});

// Params is inferred from type of `tag` parameter, so no need to default it to any
function When<Params>(pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params>) {
  let when: When<Params> = Object.create (prototype);

  when.pred = pred;
  when.tag = tag;

  return when;
}

When.isWhen = function <Params = any> (x: any): x is When<Params> {
  return x != null && x[refqlType] === type;
};

export default When;