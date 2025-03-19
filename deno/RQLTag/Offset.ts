import { SQLTag } from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import { refqlType } from "../common/consts.ts";
import { TagFunctionVariable } from "../common/types.ts";
import RQLNode, { rqlNodePrototype } from "./RQLNode.ts";

interface Offset<Params = any> extends RQLNode {
  params: Params;
  run: TagFunctionVariable<Params, number>;
  interpret<Params = any>(): SQLTag<Params>;
}

const type = "refql/Offset";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Offset,
  [refqlType]: type,
  interpret
});

function Offset<Params>(run: TagFunctionVariable<Params, number> | number) {
  let offset: Offset<Params> = Object.create (prototype);

  offset.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, number>;

  return offset;
}

function interpret(this: Offset) {
  const { run } = this;

  return sql`
    offset ${run}
  `;
}

Offset.isOffset = function <Params = any> (x: any): x is Offset<Params> {
  return x != null && x[refqlType] === type;
};

export default Offset;