import { flMap, refqlType } from "../common/consts";
import { ParamF2, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";

interface Raw extends ASTNode<unknown> {
  run: ParamF2<unknown>;
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Raw,
  [refqlType]: type,
  caseOf
});

function Raw(run: ParamF2<unknown> | boolean | number | string) {
  let raw: Raw = Object.create (prototype);

  raw.run = typeof run === "function" ? run : () => run;

  return raw;
}

function caseOf(this: Raw, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function (value: any): value is Raw {
  return value != null && value[refqlType] === type;
};

export default Raw;