import isRqlTag from "../RqlTag/isRqlTag.ts";
import isSqlTag from "../SqlTag/isSqlTag.ts";
import { TagFn } from "../types.ts";

const tag: TagFn = (baseTag, ...snippets) => {
  if (! (isRqlTag (baseTag) || isSqlTag (baseTag))) {
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