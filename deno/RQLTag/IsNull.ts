import { refqlType } from "../common/consts.ts";
import { SQLTag } from "../SQLTag/index.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface IsNull<Prop extends SQLTag | string = any, Params = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  setPred (fn: (p: any) => boolean): IsNull<Prop, Params>;
  notIsNull: boolean;
  not(): IsNull<Prop, Params>;
}

const type = "refql/IsNull";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: IsNull,
  [refqlType]: type,
  not,
  setPred,
  precedence: 1
});

function IsNull<Prop extends SQLTag | string, Params>(prop: Prop) {
  let isNull: IsNull<Prop, Params> = Object.create (prototype);

  isNull.prop = prop;

  isNull.notIsNull = false;

  return isNull;
}

function not(this: IsNull) {
  let isNull = IsNull (this.prop);

  isNull.pred = this.pred;
  isNull.notIsNull = true;

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