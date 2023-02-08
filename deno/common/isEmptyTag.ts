import RQLTag from "../RQLTag/index.ts";
import SQLTag from "../SQLTag/index.ts";

const isEmptyTag = <Params, Output>(tag: SQLTag<Params, Output> | RQLTag<Params, Output>) =>
  tag.nodes.length === 0;

export default isEmptyTag;