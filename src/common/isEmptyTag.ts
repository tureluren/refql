import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";

const isEmptyTag = <Params>(tag: SQLTag<Params> | RQLTag<Params>) =>
  tag.nodes.length === 0;

export default isEmptyTag;