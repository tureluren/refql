import { flMap, refqlType } from "../common/consts.ts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types.ts";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode.ts";
import Table from "../Table/index.ts";

interface Raw<Params> extends ASTNode<Params> {
  run: TagFunctionVariable<Params, string>;
  map(f: (x: ValueType) => ValueType): Raw<Params>;
  [flMap]: Raw<Params>["map"];
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  map,
  [flMap]: map,
  caseOf
});

function Raw<Params>(run: ValueType | TagFunctionVariable<Params>) {
  let raw: Raw<Params> = Object.create (prototype);

  raw.run = (p, t) => String ((
    typeof run === "function" && !Table.isTable (run) ? run : () => run
  ) (p, t));

  return raw;
}

function map(this: Raw<unknown>, f: (x: ValueType) => ValueType) {
  return Raw ((p, t) => {
    return f (this.run (p, t));
  });
}

function caseOf(this: Raw<unknown>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params> (x: any): x is Raw<Params> {
  return x != null && x[refqlType] === type;
};

export default Raw;