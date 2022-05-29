import { SQLTag_ } from "../types";

class Sub {
  as: string;
  tag: SQLTag_;

  constructor(as: string, tag: SQLTag_) {
    this.as = as;
    this.tag = tag;
  }
}

export default Sub;