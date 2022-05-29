import Sub from ".";
import { SQLTag_ } from "../types";

const subselect = (as: string, tag: SQLTag_) =>
  new Sub (as, tag);

export default subselect;