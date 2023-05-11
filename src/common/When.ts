import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { rqlNodePrototype } from "../RQLTag/isRQLNode";
import { SQLTag } from "../SQLTag";
import { sqlNodePrototype } from "../SQLTag/isSQLNode";

interface When<Params> {
  pred: TagFunctionVariable<Params, boolean>;
  tag: SQLTag<Params>;
}

const type = "refql/When";

const prototype = Object.assign ({}, sqlNodePrototype, rqlNodePrototype, {
  constructor: When,
  [refqlType]: type
});

function When<Params>(pred: TagFunctionVariable<Params, boolean>, tag: SQLTag<Params>) {
  let when: When<Params> = Object.create (prototype);

  when.pred = pred;
  when.tag = tag;

  return when;
}

When.isWhen = function <Params> (x: any): x is When<Params> {
  return x != null && x[refqlType] === type;
};

export const when = <Params>(pred: TagFunctionVariable<Params, boolean>) => (tag: SQLTag<Params>) =>
  When (pred, tag);

export default When;