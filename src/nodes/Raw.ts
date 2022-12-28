import { flMap, refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";
import Table from "../Table";

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

function map(this: Raw<unknown>, f: (value: ValueType) => ValueType) {
  return Raw ((p, t) => {
    return f (this.run (p, t));
  });
}

function caseOf(this: Raw<unknown>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params> (value: any): value is Raw<Params> {
  return value != null && value[refqlType] === type;
};

export default Raw;