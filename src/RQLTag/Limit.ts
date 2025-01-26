import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Limit<Params = any> extends RQLNode {
  params: Params;
  run: TagFunctionVariable<Params, number>;
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Limit,
  [refqlType]: type
});

function Limit<Params>(run: TagFunctionVariable<Params, number> | number) {
  let limit: Limit<Params> = Object.create (prototype);

  limit.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, number>;

  return limit;
}

Limit.isLimit = function <Params = any> (x: any): x is Limit<Params> {
  return x != null && x[refqlType] === type;
};

export default Limit;