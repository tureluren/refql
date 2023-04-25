import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import SQLTag2 from "../SQLTag2";
import { Boxes } from "./BoxRegistry";

const isEmptyTag = <Params, Output, Box extends Boxes>(tag: SQLTag<Params, Output, Box> | SQLTag2<Params, Output, Box> | RQLTag<any, Params, Output, Box>) =>
  tag.nodes.length === 0;

export default isEmptyTag;