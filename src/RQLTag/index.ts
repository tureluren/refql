import { flConcat, flMap, refqlType } from "../common/consts";
import { Querier, StringMap } from "../common/types";
import Interpreter from "../Interpreter";
import Root from "../nodes/Root";
import aggregate from "./aggregate";

interface RQLTag<Params> {
  node: Root<Params>;
  concat<Params2>(other: RQLTag<Params2>): RQLTag<Params & Params2>;
  map<Params2>(f: (node: Root<Params>) => Root<Params2>): RQLTag<Params2>;
  run<Return>(querier: Querier<Return>, params?: Params): Promise<Return[]>;
  [flConcat]: RQLTag<Params>["concat"];
  [flMap]: RQLTag<Params>["map"];
}

// maak aggregate functie op rqltag

const type = "refql/RQLTag";

const prototype = {
  constructor: RQLTag,
  [refqlType]: type,
  concat, [flConcat]: concat,
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

function concat(this: RQLTag<unknown>, other: RQLTag<unknown>) {
  const { table, members } = this.node;
  const { table: table2, members: members2 } = other.node;

  if (!table.equals (table2)) {
    throw new Error ("U can't concat RQLTags with a different root table");
  }

  return RQLTag (Root (
    table,
    members.concat (members2)
  ));
}

function map(this: RQLTag<unknown>, f: (node: Root<unknown>) => Root<unknown>) {
  return RQLTag (f (this.node));
}

function run(this: RQLTag<unknown>, querier: Querier<StringMap>, params?: unknown) {
  return new Promise ((res, rej) => {
    if (!(Root.isRoot (this.node))) {
      rej (new Error ("You can only run a RQLTag that holds a Root node"));
      return;
    }

    if (!this.node.hasOwnProperty ("table")) {
      rej (new Error ("The Root node has no table"));
      return;
    }

    const interpret = Interpreter (params || {});

    aggregate (querier, interpret, this.node)
      .then (res)
      .catch (rej);
  });
}

RQLTag.isRQLTag = function <Params> (value: any): value is RQLTag<Params> {
  return value != null && value[refqlType] === type;
};

export default RQLTag;