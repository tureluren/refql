import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Eq<Params = any, Type = any> extends RQLNode, Operation<Params> {
  run: TagFunctionVariable<Params, Type>;
  notEq: boolean;
}

const type = "refql/Eq";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Eq,
  [refqlType]: type,
  precedence: 1
});

function Eq<Params, Type>(run: TagFunctionVariable<Params, Type> | Type, notEq = false) {
  let eq: Eq<Params, Type> = Object.create (prototype);

  eq.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type>;

  eq.notEq = notEq;

  return eq;
}

Eq.isEq = function <Params = any, Type = any> (x: any): x is Eq<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default Eq;