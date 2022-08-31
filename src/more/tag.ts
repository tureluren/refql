import RqlTag from "../RqlTag";
import SqlTag from "../SqlTag";
import { TagFn } from "../types";

const tag: TagFn = (baseTag, ...snippets) => {
  if (! (baseTag instanceof RqlTag || baseTag instanceof SqlTag)) {
    throw new Error (
      "The first argument passed to `tag` should be of type RqlTag or SqlTag"
    );
  }

  return snippets.reduce (
    (acc, snippet) => acc.include (snippet),
    baseTag
  );
};

export default tag;