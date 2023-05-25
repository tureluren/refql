import { refqlType } from "../common/consts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Limit<ParameterProp extends string = any> extends RQLNode, SelectableType {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
  setPred (fn: (p: any) => boolean): Limit<ParameterProp>;
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Limit,
  [refqlType]: type,
  setPred,
  precedence: 3
});

function Limit<ParameterProp extends string = "limit">(prop: ParameterProp = "limit" as ParameterProp) {
  let limit: Limit<ParameterProp> = Object.create (prototype);

  limit.prop = prop;

  return limit;
}

function setPred(this: Limit, fn: (p: any) => boolean) {
  let limit = Limit (this.prop);

  limit.pred = fn;

  return limit;
}

Limit.isLimit = function <ParameterProp extends string = any> (x: any): x is Limit<ParameterProp> {
  return x != null && x[refqlType] === type;
};

export default Limit;