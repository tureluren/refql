import RqlTag from "../RqlTag/index.ts";

class Rel {
  symbol: string;
  tag: RqlTag;

  constructor(symbol: string, tag: RqlTag) {
    this.symbol = symbol;
    this.tag = tag;
  }
}

export default Rel;