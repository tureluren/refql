import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import Operation from "../Table/Operation";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface IsNull<Prop extends SQLTag | string = any, Params = any> extends RQLNode, SelectableType, Operation<Params> {
  params: Params;
  prop: Prop;
  setPred (fn: (p: any) => boolean): IsNull<Prop, Params>;
  notIsNull: boolean;
}

const type = "refql/IsNull";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: IsNull,
  [refqlType]: type,
  setPred,
  precedence: 1
});

function IsNull<Prop extends SQLTag | string, Params>(prop: Prop, notIsNull = false) {
  let isNull: IsNull<Prop, Params> = Object.create (prototype);

  isNull.prop = prop;

  isNull.notIsNull = notIsNull;

  return isNull;
}

function setPred(this: IsNull, fn: (p: any) => boolean) {
  let isNull = IsNull (this.prop);

  isNull.notIsNull = this.notIsNull;
  isNull.pred = fn;

  return isNull;
}

IsNull.isNull = function <Prop extends SQLTag | string = any, Params = any> (x: any): x is IsNull<Prop, Params> {
  return x != null && x[refqlType] === type;
};

export default IsNull;