import Rel from ".";
import RQLTag from "../RQLTag";

// const rel = (symbol: string) => (tag: RQLTag) =>
const rel = (symbol: string) => (tag: any) =>
  new Rel (symbol, tag);

export default rel;