import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Limit<Params = any> extends RQLNode, SelectableType {
  params: Params;
  run: TagFunctionVariable<Params, number>;
  setPred (fn: (p: any) => boolean): Limit<Params>;
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Limit,
  [refqlType]: type,
  setPred,
  precedence: 3
});

function Limit<Params>(run: TagFunctionVariable<Params, number> | number) {
  let limit: Limit<Params> = Object.create (prototype);

  limit.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, number>;

  return limit;
}

function setPred(this: Limit, fn: (p: any) => boolean) {
  let limit = Limit (this.run);

  limit.pred = fn;

  return limit;
}

Limit.isLimit = function <Params = any> (x: any): x is Limit<Params> {
  return x != null && x[refqlType] === type;
};

export default Limit;