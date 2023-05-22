import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Eq<Prop extends SQLTag | string = any, Params = any, Type = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type>;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Eq,
  [refqlType]: type
});

function Eq<Prop extends SQLTag | string, Params, Type>(prop: Prop, run: TagFunctionVariable<Params, Type> | Type) {
  let eq: Eq<Prop, Params, Type> = Object.create (prototype);

  eq.prop = prop;

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  return eq;
}

Eq.isEq = function <Prop extends SQLTag | string = any, Params = any, Type = any> (x: any): x is Eq<Prop, Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Eq;