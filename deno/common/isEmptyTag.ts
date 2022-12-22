import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";

const isEmptyTag = <Params>(tag: SQLTag<Params> | RQLTag<Params>) =>
  tag.nodes.length === 0;

export default isEmptyTag;