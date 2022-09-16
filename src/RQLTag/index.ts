import { flMap, refqlType } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import Interpreter from "../Interpreter";
import { Root } from "../Parser/nodes";
import aggregate from "./aggregate";

interface RQLTag<Params> {
  node: Root<Params>;
  map<Params2>(f: (node: Root<Params>) => Root<Params2>): RQLTag<Params & Params2>;
  [flMap]: RQLTag<Params>["map"];
  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]>;
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

function map<Params, Params2>(this: RQLTag<Params>, f: (node: Root<Params>) => Root<Params2>) {
  return RQLTag (f (this.node));
}

function run<Params, Return>(this: RQLTag<Params>, querier: Querier<Return>, params: StringMap) {
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