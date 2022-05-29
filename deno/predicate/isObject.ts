import { Dict } from "../types";

const isObject = (value: any): value is Dict =>
  toString.call (value) === "[object Object]";

export default isObject;