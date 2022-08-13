import Rel from "./index.ts";
import RqlTag from "../RqlTag/index.ts";

const rel = (symbol: string) => (tag: RqlTag) =>
  new Rel (symbol, tag);

export default rel;