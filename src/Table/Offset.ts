import { refqlType } from "../common/consts";
import { RQLNode } from "../common/types";
import { rqlNodePrototype } from "../RQLTag/isRQLNode";
import SelectableType from "../Table/SelectableType";

interface Offset<ParameterProp extends string = any> extends RQLNode {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
  [SelectableType]: true;
}

const type = "refql/Offset";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Offset,
  [refqlType]: type,
  [SelectableType]: true
});

function Offset<ParameterProp extends string = "offset">(prop: ParameterProp = "offset" as ParameterProp) {
  let offset: Offset<ParameterProp> = Object.create (prototype);

  offset.prop = prop;

  return offset;
}

Offset.isOffset = function <ParameterProp extends string = any> (x: any): x is Offset<ParameterProp> {
  return x != null && x[refqlType] === type;
};

export default Offset;