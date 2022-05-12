import { Rel, RQLTag } from "../types";

const prototype: Omit<Rel, "symbol" | "tag"> = {
  constructor: Rel,
  "@@rql/type": "Rel"
};

function Rel(symbol: string) {
  return (tag: RQLTag): Rel => {
    const rel = Object.create (prototype);
    rel.symbol = symbol;
    rel.tag = tag;
    return rel;
  };
};

export default Rel;