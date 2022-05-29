import isRQLTag from "../RQLTag/isRQLTag";
import isSQLTag from "../SQLTag/isSQLTag";
import { TagFn } from "../types";

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