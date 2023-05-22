import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface In<Prop extends SQLTag | string = any, Params = any, Type = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type[]>;
}

const type = "refql/In";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: In,
  [refqlType]: type
});

function In<Prop extends SQLTag | string, Params, Type>(prop: Prop, run: TagFunctionVariable<Params, Type[]> | Type[]) {
  let whereIn: In<Prop, Params, Type> = Object.create (prototype);

  whereIn.prop = prop;

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type[]>;

  return whereIn;
}

In.isIn = function <Prop extends SQLTag | string = any, Params = any, Type = any> (x: any): x is In<Prop, Params, Type> {
  return x != null && x[refqlType] === type;
};

export default In;