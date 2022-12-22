import { refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode.ts";

interface Raw<Params> extends ASTNode<Params> {
  run: TagFunctionVariable<Params>;
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  caseOf
});

function Raw<Params>(run: ValueType | TagFunctionVariable<Params>) {
  let raw: Raw<Params> = Object.create (prototype);

  raw.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return raw;
}

function caseOf(this: Raw<unknown>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params> (value: any): value is Raw<Params> {
  return value != null && value[refqlType] === type;
};

export default Raw;