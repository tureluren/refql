import { refqlType } from "../common/consts";
import RQLNode, { rqlNodePrototype } from "../RQLTag/RQLNode";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";

interface Limit<ParameterProp extends string = any> extends RQLNode, SelectableType {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Limit,
  [refqlType]: type
});

function Limit<ParameterProp extends string = "limit">(prop: ParameterProp = "limit" as ParameterProp) {
  let limit: Limit<ParameterProp> = Object.create (prototype);

  limit.prop = prop;

  return limit;
}

Limit.isLimit = function <ParameterProp extends string = any> (x: any): x is Limit<ParameterProp> {
  return x != null && x[refqlType] === type;
};

export default Limit;