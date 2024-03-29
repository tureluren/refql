import { refqlType } from "../common/consts.ts";
import { OrdOperator, TagFunctionVariable } from "../common/types.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Ord<Prop extends SQLTag | string = any, Params = any, Type = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type>;
  setPred (fn: (p: any) => boolean): Ord<Prop, Params, Type>;
  operator: OrdOperator;
}

const type = "refql/Ord";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Ord,
  [refqlType]: type,
  setPred,
  precedence: 1
});

function Ord<Prop extends SQLTag | string, Params, Type>(prop: Prop, run: TagFunctionVariable<Params, Type> | Type, operator: OrdOperator) {
  let ord: Ord<Prop, Params, Type> = Object.create (prototype);

  ord.prop = prop;

  ord.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  ord.operator = operator;

  return ord;
}

function setPred(this: Ord, fn: (p: any) => boolean) {
  let ord = Ord (this.prop, this.run, this.operator);

  ord.pred = fn;

  return ord;
}

Ord.isOrd = function <Prop extends SQLTag | string = any, Params = any, Type = any> (x: any): x is Ord<Prop, Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Ord;