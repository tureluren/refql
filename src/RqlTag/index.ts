import Interpreter from "../Interpreter";
import { Root } from "../Parser/nodes";
import { RefQLConfig, Querier } from "../types";
import aggregate from "./aggregate";

class RQLTag <Params> {
  node: Root<Params>;

  constructor(node: Root<Params>) {
    if (!(node instanceof Root)) {
      throw new Error ("RQLTag should hold a Root node");
    }
    this.node = node;
  }

  map<Params2>(fn: (node: Root<Params>) => Root<Params2>) {
    return new RQLTag<Params2> (fn (this.node));
  }

  run<Return>(config: RefQLConfig, querier: Querier<Return>, params: Params): Promise<Return[]> {
    return new Promise ((res, rej) => {
      if (!(this.node instanceof Root)) {
        rej (new Error ("You can only run a RQLTag that holds a Root node"));
        return;
      }

      if (!this.node.hasOwnProperty ("table")) {
        rej (new Error ("The Root node has no table"));
        return;
      }

      const interpret = Interpreter (config.caseType, params);

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