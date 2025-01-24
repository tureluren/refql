import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP } from "../SQLTag/sql";
import Operation, { operationPrototype } from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Like<Params = any> extends RQLNode, Operation<Params> {
  run: TagFunctionVariable<Params, string>;
  caseSensitive: boolean;
  notLike: boolean;
}

const type = "refql/Like";

const prototype = Object.assign ({}, rqlNodePrototype, operationPrototype, {
  constructor: Like,
  [refqlType]: type,
  precedence: 1,
  interpret
});

function Like<Params>(run: TagFunctionVariable<Params, string> | string, pred?: TagFunctionVariable<Params, boolean>, caseSensitive = true, notLike = false) {
  let like: Like<Params> = Object.create (prototype);

  like.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, string>;

  if (pred) {
    like.pred = pred;
  }

  like.caseSensitive = caseSensitive;
  like.notLike = notLike;

  return like;
}

function interpret(this: Like, col: Raw | SQLTag) {
  const { pred, run, caseSensitive, notLike } = this;
  const like = caseSensitive ? "like" : "ilike";
  const equality = notLike ? `not ${like}` : like;

  return sqlP (pred)`
    and ${col} ${Raw (equality)} ${run}
  `;
}

Like.isLike = function <Params = any> (x: any): x is Like<Params> {
  return x != null && x[refqlType] === type;
};

export default Like;