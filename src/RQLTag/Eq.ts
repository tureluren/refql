import { refqlType } from "../common/consts";
import { OnlyStringColProps, TagFunctionVariable } from "../common/types";
import Table from "../Table";
import { rqlNodePrototype } from "./isRQLNode";

interface Eq<Props, Params> {
  params: Params;
  prop: keyof OnlyStringColProps<Props>;
  run: TagFunctionVariable<Params, OnlyStringColProps<Props>[Eq<Props, Params>["prop"]]["type"]>;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Eq,
  [refqlType]: type
});

function Eq<Props, Params, P extends keyof OnlyStringColProps<Props>>(prop: P, run: TagFunctionVariable<Params, OnlyStringColProps<Props>[P]["type"]> | OnlyStringColProps<Props>[P]["type"]) {
  let eq: Eq<Props, Params> = Object.create (prototype);

  eq.prop = prop;

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return eq;
}

Eq.isEq = function <T extends Table, Params> (x: any): x is Eq<T, Params> {
  return x != null && x[refqlType] === type;
};

export default Eq;