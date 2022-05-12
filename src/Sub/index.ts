import { SQLTag_, Sub } from "../types";

const prototype: Omit<Sub, "as" | "tag"> = {
  constructor: Sub,
  "@@rql/type": "Sub"
};

function Sub(as: string, tag: SQLTag_): Sub {
  const sub = Object.create (prototype);
  sub.as = as;
  sub.tag = tag;
  return sub;
}

export default Sub;