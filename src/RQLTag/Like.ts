import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Like<Prop extends SQLTag | string = any, Params = any> extends RQLNode, Operation<Params> {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, string>;
  caseSensitive: boolean;
  notLike: boolean;
}

const type = "refql/Like";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: Like,
  [refqlType]: type,
  precedence: 1
});

function Like<Prop extends SQLTag | string, Params>(prop: Prop, run: TagFunctionVariable<Params, string> | string, caseSensitive = true, notLike = false) {
  let like: Like<Prop, Params> = Object.create (prototype);

  like.prop = prop;

  like.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, string>;

  like.caseSensitive = caseSensitive;
  like.notLike = notLike;

  return like;
}

Like.isLike = function <Prop extends SQLTag | string = any, Params = any> (x: any): x is Like<Prop, Params> {
  return x != null && x[refqlType] === type;
};

export default Like;