import { Link } from "../types.ts";

const makeLinks = (arr1: string[], arr2: string[]): Link[] =>
  arr1.map ((_, idx) => [arr1[idx], arr2[idx]]);

export default makeLinks;