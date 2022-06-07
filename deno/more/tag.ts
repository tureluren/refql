import isRQLTag from "../RQLTag/isRQLTag.ts";
import isSQLTag from "../SQLTag/isSQLTag.ts";
import { TagFn } from "../types.ts";

const tag: TagFn = (baseTag, ...snippets) => {
  if (! (isRQLTag (baseTag) || isSQLTag (baseTag))) {
    throw new Error (
      "The first argument passed to `tag` should be of type RQLTag or SQLTag"
    );
  }

  return snippets.reduce (
    (acc, snippet) => acc.include (snippet),
    baseTag
  );
};

export default tag;