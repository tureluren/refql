import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Operation from "../Table/Operation";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface In<Prop extends SQLTag | string = any, Params = any, Type = any> extends RQLNode, SelectableType, Operation<Params> {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, Type[]>;
  setPred (fn: (p: any) => boolean): In<Prop, Params, Type>;
  notIn: boolean;
}

const type = "refql/In";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: In,
  [refqlType]: type,
  setPred,
  precedence: 1
});

function In<Prop extends SQLTag | string, Params, Type>(prop: Prop, run: TagFunctionVariable<Params, Type[]> | Type[], notIn = false) {
  let whereIn: In<Prop, Params, Type> = Object.create (prototype);

  whereIn.prop = prop;

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type[]>;

  whereIn.notIn = notIn;

  return whereIn;
}

function setPred(this: In, fn: (p: any) => boolean) {
  let whereIn = In (this.prop, this.run);

  whereIn.notIn = this.notIn;
  whereIn.pred = fn;

  return whereIn;
}

In.isIn = function <Prop extends SQLTag | string = any, Params = any, Type = any> (x: any): x is In<Prop, Params, Type> {
  return x != null && x[refqlType] === type;
};

export default In;