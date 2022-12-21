import { refqlType } from "../common/consts";
import { TagFunctionVariable, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";

interface Raw<Params, InRQL extends boolean> extends ASTNode<Params, InRQL> {
  run: TagFunctionVariable<Params, InRQL>;
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  caseOf
});

function Raw<Params, InRQL extends boolean>(run: boolean | number | string | TagFunctionVariable<Params, InRQL>) {
  let raw: Raw<Params, InRQL> = Object.create (prototype);

  raw.run = typeof run === "function" ? run : () => run;

  return raw;
}

function caseOf(this: Raw<unknown, false>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params> (value: any): value is Raw<Params, false> {
  return value != null && value[refqlType] === type;
};

export default Raw;