import { Link, Refs } from "../types.ts";

const getRefPath = (tableFrom: string, tableTo: string, refs: Refs): Link[] | undefined =>
  refs[tableFrom] && refs[tableFrom][tableTo];

export default getRefPath;