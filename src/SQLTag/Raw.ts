import { flMap, refqlType } from "../common/consts";
import { TagFunctionVariable, ValueType } from "../common/types";
import Table from "../Table";
import { sqlNodePrototype } from "./isSQLNode";

interface Raw<Params> {
  run: TagFunctionVariable<Params, string>;
  map(f: (x: ValueType) => ValueType): Raw<Params>;
  [flMap]: Raw<Params>["map"];
}

const type = "refql/Raw";

const prototype = Object.assign ({}, sqlNodePrototype, {
  [refqlType]: type,
  constructor: Raw,
  map,
  [flMap]: map
});

function Raw<Params>(run: ValueType | TagFunctionVariable<Params>) {
  let raw: Raw<Params> = Object.create (prototype);

  raw.run = p => String ((
    typeof run === "function" && !Table.isTable (run) ? run : () => run
  ) (p));

  return raw;
}

function map<Params>(this: Raw<Params>, f: (x: ValueType) => ValueType) {
  return Raw<Params> (p => {
    return f (this.run (p));
  });
}

Raw.isRaw = function<Params> (x: any): x is Raw<Params> {
  return x != null && x[refqlType] === type;
};

export default Raw;