import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Offset<Params = any> extends RQLNode, SelectableType {
  params: Params;
  run: TagFunctionVariable<Params, number>;
  setPred (fn: (p: any) => boolean): Offset<Params>;
}

const type = "refql/Offset";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Offset,
  [refqlType]: type,
  setPred,
  precedence: 4
});

function Offset<Params>(run: TagFunctionVariable<Params, number> | number) {
  let offset: Offset<Params> = Object.create (prototype);

  offset.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, number>;

  return offset;
}

function setPred(this: Offset, fn: (p: any) => boolean) {
  let offset = Offset (this.run);

  offset.pred = fn;

  return offset;
}

Offset.isOffset = function <Params = any> (x: any): x is Offset<Params> {
  return x != null && x[refqlType] === type;
};

export default Offset;