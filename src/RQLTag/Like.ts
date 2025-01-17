import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Operation from "../Table/Operation";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Like<Prop extends SQLTag | string = any, Params = any> extends RQLNode, SelectableType, Operation<Params> {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, string>;
  setPred (fn: (p: any) => boolean): Like<Prop, Params>;
  caseSensitive: boolean;
  notLike: boolean;
}

const type = "refql/Like";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Like,
  [refqlType]: type,
  setPred,
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

function setPred(this: Like, fn: (p: any) => boolean) {
  let like = Like (this.prop, this.run, this.caseSensitive);

  like.notLike = this.notLike;
  like.pred = fn;

  return like;
}

Like.isLike = function <Prop extends SQLTag | string = any, Params = any> (x: any): x is Like<Prop, Params> {
  return x != null && x[refqlType] === type;
};

export default Like;