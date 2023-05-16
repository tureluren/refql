import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import { rqlNodePrototype } from "./isRQLNode";
import SelectableType from "./SelectableType";

interface Eq<Prop extends SQLTag | string = any, Type = any, Params = any> {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type>;
  [SelectableType]: true;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Eq,
  [refqlType]: type,
  [SelectableType]: true
});

function Eq<Prop extends SQLTag | string, Type, Params>(prop: Prop, run: TagFunctionVariable<Params, Type> | Type) {
  let eq: Eq<Prop, Type, Params> = Object.create (prototype);

  eq.prop = prop;

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  return eq;
}

Eq.isEq = function <Prop extends SQLTag | string = any, Type = any, Params = any> (x: any): x is Eq<Prop, Type, Params> {
  return x != null && x[refqlType] === type;
};

export default Eq;