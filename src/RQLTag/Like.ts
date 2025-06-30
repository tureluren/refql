import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";

interface Like<Params = any> extends Operation<Params> {
  run: TagFunctionVariable<Params, string>;
  caseSensitive: boolean;
  notLike: boolean;
}

const type = "refql/Like";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: Like,
  [refqlType]: type,
  interpret
});

function Like<Params>(run: TagFunctionVariable<Params, string> | string, caseSensitive = false, notLike = false) {
  let like: Like<Params> = Object.create (prototype);

  like.run = (
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, string>;


  like.caseSensitive = caseSensitive;
  like.notLike = notLike;

  return like;
}

function interpret(this: Like, col: Raw | SQLTag) {
  const { run, caseSensitive, notLike } = this;
  const like = caseSensitive ? "like" : "ilike";
  const equality = notLike ? `not ${like}` : like;

  return sqlX`
    and ${col} ${Raw (equality)} ${run}
  `;
}

Like.isLike = function <Params = any> (x: any): x is Like<Params> {
  return x != null && x[refqlType] === type;
};

export default Like;