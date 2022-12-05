import { flMap, refqlType } from "../common/consts";
import { TagFunctionVariable, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";

interface Raw<Params> extends ASTNode<Params> {
  // (run: TagFunctionVariable<Params> | boolean | number | string): Raw<Params>;
  run: TagFunctionVariable<Params>;
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Raw,
  [refqlType]: type,
  caseOf
});

function Raw<Params>(run: TagFunctionVariable<Params> | boolean | number | string) {
  let raw: Raw<Params> = Object.create (prototype);

  raw.run = typeof run === "function" ? run : () => run;

  return raw;
}

function caseOf(this: Raw<unknown>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params> (value: any): value is Raw<Params> {
  return value != null && value[refqlType] === type;
};

export default Raw;