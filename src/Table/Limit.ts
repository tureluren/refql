import { refqlType } from "../common/consts";
import { RQLNode, rqlNodePrototype } from "../RQLTag/RQLNodeType";
import SelectableType from "../Table/SelectableType";

interface Limit<ParameterProp extends string = any> extends RQLNode {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
  [SelectableType]: true;
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Limit,
  [refqlType]: type,
  [SelectableType]: true
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