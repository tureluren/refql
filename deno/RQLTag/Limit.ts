import { SQLTag } from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Limit<Params = any> extends RQLNode {
  params: Params;
  run: TagFunctionVariable<Params, number>;
  interpret<Params = any>(): SQLTag<Params>;
}

const type = "refql/Limit";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Limit,
  [refqlType]: type,
  interpret
});

function Limit<Params>(run: TagFunctionVariable<Params, number> | number) {
  let limit: Limit<Params> = Object.create (prototype);

  limit.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, number>;

  return limit;
}

function interpret(this: Limit) {
  const { run } = this;

  return sql`
    limit ${run}
  `;
}

Limit.isLimit = function <Params = any> (x: any): x is Limit<Params> {
  return x != null && x[refqlType] === type;
};

export default Limit;