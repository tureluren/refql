import { refqlType } from "../common/consts";
import { TagFunctionVariable, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";

interface Raw<Params, InRQL extends boolean = true> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, InRQL>;
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  caseOf
});

function Raw<Params, InRQL extends boolean = true>(run: boolean | number | string | TagFunctionVariable<Params, InRQL>) {
  let raw: Raw<Params, InRQL> = Object.create (prototype);

  raw.run = typeof run === "function" ? run : () => run;

  return raw;
}

function caseOf(this: Raw<unknown>, structureMap: StringMap) {
  return structureMap.Raw (this.run, this.delimiter);
}

Raw.isRaw = function<Params> (value: any): value is Raw<Params> {
  return value != null && value[refqlType] === type;
};

export default Raw;