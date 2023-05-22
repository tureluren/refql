import { refqlType } from "../common/consts.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Offset<ParameterProp extends string = any> extends RQLNode, SelectableType {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
}

const type = "refql/Offset";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Offset,
  [refqlType]: type
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