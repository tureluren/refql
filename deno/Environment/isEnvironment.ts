import Environment from "./index.ts";

const isEnvironment = (value: any): value is Environment =>
  value instanceof Environment;

export default isEnvironment;
