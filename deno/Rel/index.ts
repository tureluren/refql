import RQLTag from "../RQLTag/index.ts";

class Rel {
  symbol: string;
  tag: RQLTag;

  constructor(symbol: string, tag: RQLTag) {
    this.symbol = symbol;
    this.tag = tag;
  }
}

export default Rel;