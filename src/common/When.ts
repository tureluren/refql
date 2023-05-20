import { refqlType } from "../common/consts";
import { RQLNode, TagFunctionVariable } from "../common/types";
import { rqlNodePrototype } from "../RQLTag/isRQLNode";
import { SQLTag } from "../SQLTag";
import { sqlNodePrototype } from "../SQLTag/isSQLNode";
import SelectableType from "../Table/SelectableType";

interface When<Params = any> extends RQLNode {
  params: Params;
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params>;
  whenable: true;
  [SelectableType]: true;
}

const type = "refql/When";

const prototype = Object.assign ({}, sqlNodePrototype, rqlNodePrototype, {
  constructor: When,
  [refqlType]: type,
  [SelectableType]: true
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