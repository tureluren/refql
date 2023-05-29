import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import SelectableType, { selectableTypePrototype } from "../Table/SelectableType";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface Like<Prop extends SQLTag | string = any, Params = any> extends RQLNode, SelectableType {
  params: Params;
  prop: Prop;
  run: TagFunctionVariable<Params, string>;
  setPred (fn: (p: any) => boolean): Like<Prop, Params>;
}

const type = "refql/Like";

const prototype = Object.assign ({}, rqlNodePrototype, selectableTypePrototype, {
  constructor: Like,
  [refqlType]: type,
  setPred,
  precedence: 1
});

const considerPercentSign = <Params>(run: TagFunctionVariable<Params, string>) => (p: Params): string => {
  const value = run (p);
  if (value.includes ("%")) return value;
  return `${value}%`;
};

function Like<Prop extends SQLTag | string, Params>(prop: Prop, run: TagFunctionVariable<Params, string> | string) {
  let like: Like<Prop, Params> = Object.create (prototype);

  like.prop = prop;

  like.run = considerPercentSign<Params> ((
    typeof run === "function" ? run : () => run
  ) as TagFunctionVariable<Params, string>);

  return like;
}

function setPred(this: Like, fn: (p: any) => boolean) {
  let like = Like (this.prop, this.run);

  like.pred = fn;

  return like;
}

Like.isLike = function <Prop extends SQLTag | string = any, Params = any> (x: any): x is Like<Prop, Params> {
  return x != null && x[refqlType] === type;
};

export default Like;