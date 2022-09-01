import Interpreter from "../Interpreter";
import { Root } from "../Parser/nodes";
import { RefQLConfig, Querier } from "../types";
import aggregate from "./aggregate";

class RqlTag <Params> {
  node: Root<Params>;

  constructor(node: Root<Params>) {
    if (!(node instanceof Root)) {
      throw new Error ("RqlTag should hold a Root node");
    }
    this.node = node;
  }

  map<Params2>(fn: (node: Root<Params>) => Root<Params2>) {
    return new RqlTag<Params2> (fn (this.node));
  }

  run<Return>(config: RefQLConfig, querier: Querier<Return>, params: Params): Promise<Return[]> {
    return new Promise ((res, rej) => {
      if (!(this.node instanceof Root)) {
        rej (new Error ("You can only run a RqlTag that holds a Root node"));
      }

      if (!this.node.hasOwnProperty ("table")) {
        rej (new Error ("The Root node has no table"));
      }

      const interpret = Interpreter (config.caseType, params);

      aggregate<Params> (querier, interpret, this.node)
        .then (res)
        .catch (rej);
    });
  }

  static of<Params>(node: Root<Params>) {
    return new RqlTag<Params> (node);
  }
}

export default RqlTag;