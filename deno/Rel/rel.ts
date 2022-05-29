import Rel from ".";
import RQLTag from "../RQLTag";

const rel = (symbol: string) => (tag: RQLTag) =>
  new Rel (symbol, tag);

export default rel;