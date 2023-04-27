import { flMap, refqlType } from "../common/consts";
import { StringMap, TagFunctionVariable, ValueType } from "../common/types";
import ASTNode, { astNodePrototype } from "../nodes/ASTNode";
import Table from "../Table";

interface Raw<Params, Output> extends ASTNode<Params, Output> {
  run: TagFunctionVariable<Params, string>;
  map(f: (x: ValueType) => ValueType): Raw<Params, Output>;
  [flMap]: Raw<Params, Output>["map"];
}

const type = "refql/Raw";

const prototype = Object.assign ({}, astNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  map,
  [flMap]: map,
  caseOf
});

function Raw<Params, Output>(run: ValueType | TagFunctionVariable<Params>) {
  let raw: Raw<Params, Output> = Object.create (prototype);

  raw.run = p => String ((
    typeof run === "function" && !Table.isTable (run) ? run : () => run
  ) (p));

  return raw;
}

function map<Params, Output>(this: Raw<Params, Output>, f: (x: ValueType) => ValueType) {
  return Raw<Params, Output> (p => {
    return f (this.run (p));
  });
}

function caseOf<Params, Output>(this: Raw<Params, Output>, structureMap: StringMap) {
  return structureMap.Raw (this.run);
}

Raw.isRaw = function<Params, Output> (x: any): x is Raw<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Raw;