import { flMap, refqlType } from "../common/consts";
import { Boxes } from "../common/BoxRegistry";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";
import Table2 from "../Table2";

interface Raw<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box> {
  run: TagFunctionVariable<Params, Box, string>;
  map(f: (x: ValueType) => ValueType): Raw<Params, Output, Box>;
  [flMap]: Raw<Params, Output, Box>["map"];
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  map,
  [flMap]: map,
  caseOf
});

function Raw<Params, Output, Box extends Boxes>(run: ValueType | TagFunctionVariable<Params, Box>) {
  let raw: Raw<Params, Output, Box> = Object.create (prototype);

  raw.run = (p, t) => String ((
    typeof run === "function" && !Table2.isTable (run) ? run : () => run
  ) (p, t));

  return raw;
}

function map<Params, Output, Box extends Boxes>(this: Raw<Params, Output, Box>, f: (x: ValueType) => ValueType) {
  return Raw<Params, Output, Box> ((p, t) => {
    return f (this.run (p, t));
  });
}

function caseOf<Params, Output, Box extends Boxes>(this: Raw<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params, Output, Box extends Boxes> (x: any): x is Raw<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Raw;