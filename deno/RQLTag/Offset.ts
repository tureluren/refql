import { refqlType } from "../common/consts.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Offset<ParameterProp extends string = any> extends RQLNode, SelectableType {
  prop: ParameterProp;
  params: { [k in ParameterProp]: number };
  setPred (fn: (p: any) => boolean): Offset<ParameterProp>;
}

const type = "refql/Offset";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Offset,
  [refqlType]: type,
  setPred,
  precedence: 4
});

function Offset<ParameterProp extends string = "offset">(prop: ParameterProp = "offset" as ParameterProp) {
  let offset: Offset<ParameterProp> = Object.create (prototype);

  offset.prop = prop;

  return offset;
}

function setPred(this: Offset, fn: (p: any) => boolean) {
  let offset = Offset (this.prop);

  offset.pred = fn;

  return offset;
}

Offset.isOffset = function <ParameterProp extends string = any> (x: any): x is Offset<ParameterProp> {
  return x != null && x[refqlType] === type;
};

export default Offset;