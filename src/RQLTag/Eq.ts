import { refqlType } from "../common/consts";
import { OnlyStringColProps, TagFunctionVariable } from "../common/types";
import { rqlNodePrototype } from "./isRQLNode";

interface Eq<Props, P extends keyof OnlyStringColProps<Props>, Params> {
  params: Params;
  prop: P;
  run: TagFunctionVariable<Params, OnlyStringColProps<Props>[P]["type"]>;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Eq,
  [refqlType]: type
});

function Eq<Props, P extends keyof OnlyStringColProps<Props>, Params>(prop: P, run: TagFunctionVariable<Params, OnlyStringColProps<Props>[P]["type"]> | OnlyStringColProps<Props>[P]["type"]) {
  let eq: Eq<Props, P, Params> = Object.create (prototype);

  eq.prop = prop;

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params>;

  return eq;
}

Eq.isEq = function <Props, P extends keyof OnlyStringColProps<Props>, Params> (x: any): x is Eq<Props, P, Params> {
  return x != null && x[refqlType] === type;
};

export default Eq;