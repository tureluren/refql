import { flMap, refqlType } from "../common/consts.ts";
import { Querier, StringMap } from "../common/types.ts";
import Interpreter from "../Interpreter/index.ts";
import Root from "../nodes/Root.ts";
import aggregate from "./aggregate.ts";

interface RQLTag<Params> {
  node: Root<Params>;
  map<Params2>(f: (node: Root<Params>) => Root<Params2>): RQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
  [flMap]: RQLTag<Params>["map"];
}

const rqlTagType = "refql/RQLTag";

const prototype = {
  constructor: RQLTag,
  [refqlType]: rqlTagType,
  map, [flMap]: map, run
};

function RQLTag<Params>(node: Root<Params>) {
  if (!(Root.isRoot (node))) {
    throw new Error ("RQLTag should hold a Root node");
  }

  let tag: RQLTag<Params> = Object.create (prototype);
  tag.node = node;

  return tag;
}

function map(this: RQLTag<unknown>, f: (node: Root<unknown>) => Root<unknown>) {
  return RQLTag (f (this.node));
}

function run(this: RQLTag<unknown>, querier: Querier<StringMap>, params: unknown = {}) {
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

    aggregate (querier, interpret, this.node)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params> (value: any): value is RQLTag<Params> {
  return value != null && value[refqlType] === rqlTagType;
};

export default RQLTag;