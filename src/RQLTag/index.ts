import Interpreter from "../Interpreter";
import { Root } from "../Parser/nodes";
import { Querier } from "../types";
import aggregate from "./aggregate";

interface RQLTag <Params> {
  node: Root;
  map(f: (node: Root) => Root): RQLTag<Params>;
  run<Return = any>(querier: Querier<Return>, params: Params): Promise<Return[]>;
}

const prototype = {
  constructor: RQLTag,
  map, "fantasy-land/map": map, run
};

function RQLTag<Params>(node: Root) {
  if (!(Root.isRoot (node))) {
    throw new Error ("RQLTag should hold a Root node");
  }

  let tag: RQLTag<Params> = Object.create (RQLTag.prototype);
  tag.node = node;

  return tag;
}

RQLTag.prototype = Object.create (prototype);

function map<Params>(this: RQLTag<Params>, f: (node: Root) => Root) {
  return RQLTag (f (this.node));
}

function run<Params>(this: RQLTag<Params>, querier: Querier, params: Params) {
  return new Promise ((res, rej) => {
    if (!(Root.isRoot (this.node))) {
      rej (new Error ("You can only run a RQLTag that holds a Root node"));
      return;
    }

    if (!this.node.hasOwnProperty ("table")) {
      rej (new Error ("The Root node has no table"));
      return;
    }

    const interpret = Interpreter (params);

    aggregate<Params> (querier, interpret, this.node)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params = {}> (value: any): value is RQLTag<Params> {
  return value instanceof RQLTag;
};

export default RQLTag;