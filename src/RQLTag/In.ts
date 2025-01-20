import { refqlType } from "../common/consts";
import { InterpretedString, TagFunctionVariable } from "../common/types";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface In<Params = any, Type = any> extends RQLNode, Operation<Params, Type[]> {
  params: Params;
  notIn: boolean;
}

const type = "refql/In";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: In,
  [refqlType]: type,
  precedence: 1,
  interpret
});

function In<Params, Type>(run: TagFunctionVariable<Params, Type[]> | Type[], notIn = false) {
  let whereIn: In<Params, Type> = Object.create (prototype);

  whereIn.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, Type[]>;

  whereIn.notIn = notIn;

  return whereIn;
}

function interpret <Params = any>(this: In, pred: TagFunctionVariable<Params, boolean>) {
  const { notIn, run } = this;
  const equality = notIn ? "not in" : "in";

  const beginning: InterpretedString<Params> = { pred, run: () => [" and ", 0] };

  const ending: InterpretedString<Params> = {
    pred,
    run: (p, i) => {
      const xs = run (p);
      return [
        ` ${equality} (${xs.map ((_x, j) => `$${i + j + 1}`).join (", ")})`,
        xs.length
      ];
    }
  };


  return [beginning, ending];
}

In.isIn = function <Params = any, Type = any> (x: any): x is In<Params, Type> {
  return x != null && x[refqlType] === type;
};

export default In;