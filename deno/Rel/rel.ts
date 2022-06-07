import Rel from "./index.ts";
import RQLTag from "../RQLTag/index.ts";

const rel = (symbol: string) => (tag: RQLTag) =>
  new Rel (symbol, tag);

export default rel;