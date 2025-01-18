import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface In<Params = any, Type = any> extends RQLNode, Operation<Params> {
  params: Params;
  run: TagFunctionVariable<Params, Type[]>;
  notIn: boolean;
}

const type = "refql/In";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: In,
  [refqlType]: type,
  precedence: 1
});

function In<Params, Type>(run: TagFunctionVariable<Params, Type[]> | Type[], notIn = false) {
  let whereIn: In<Params, Type> = Object.create (prototype);

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type[]>;

  whereIn.notIn = notIn;

  return whereIn;
}

In.isIn = function <Params = any, Type = any> (x: any): x is In<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default In;