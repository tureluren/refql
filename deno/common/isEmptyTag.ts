import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";
import { Boxes } from "./BoxRegistry.ts";

const isEmptyTag = <Params, Output, Box extends Boxes>(tag: SQLTag<Params, Output, Box> | RQLTag<Params, Output, Box>) =>
  tag.nodes.length === 0;

export default isEmptyTag;