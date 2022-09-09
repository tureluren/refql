import Interpreter from "../Interpreter/index.ts";
import { Root } from "../Parser/nodes.ts";
import { Querier } from "../types.ts";
import aggregate from "./aggregate.ts";

class RQLTag <Params> {
  node: Root<Params>;

  constructor(node: Root<Params>) {
    if (!(node instanceof Root)) {
      throw new Error ("RQLTag should hold a Root node");
    }
    this.node = node;
  }

  map<Params2>(f: (node: Root<Params>) => Root<Params2>) {
    return new RQLTag<Params2> (f (this.node));
  }

  run<Return>(querier: Querier<Return>, params: Params): Promise<Return[]> {
    return new Promise ((res, rej) => {
      if (!(this.node instanceof Root)) {
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

  static of<Params>(node: Root<Params>) {
    return new RQLTag<Params> (node);
  }
}

export default RQLTag;