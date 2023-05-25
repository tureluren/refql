import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Eq<Prop extends SQLTag | string = any, Params = any, Type = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type>;
  setPred (fn: (p: any) => boolean): Eq<Prop, Params, Type>;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Eq,
  [refqlType]: type,
  setPred,
  precedence: 1
});

function Eq<Prop extends SQLTag | string, Params, Type>(prop: Prop, run: TagFunctionVariable<Params, Type> | Type) {
  let eq: Eq<Prop, Params, Type> = Object.create (prototype);

  eq.prop = prop;

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  return eq;
}

function setPred(this: Eq, fn: (p: any) => boolean) {
  let eq = Eq (this.prop, this.run);

  eq.pred = fn;

  return eq;
}

Eq.isEq = function <Prop extends SQLTag | string = any, Params = any, Type = any> (x: any): x is Eq<Prop, Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Eq;