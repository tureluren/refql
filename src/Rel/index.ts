import RqlTag from "../RqlTag";

class Rel {
  symbol: string;
  tag: any;

  constructor(symbol: string, tag: any) {
    this.symbol = symbol;
    this.tag = tag;
  }
}

export default Rel;