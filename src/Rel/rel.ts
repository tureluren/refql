import Rel from ".";
import RqlTag from "../RqlTag";

// const rel = (symbol: string) => (tag: RqlTag) =>
const rel = (symbol: string) => (tag: any) =>
  new Rel (symbol, tag);

export default rel;