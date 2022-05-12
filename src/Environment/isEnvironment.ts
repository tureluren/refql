import Environment from ".";

const isEnvironment = (value): value is Environment =>
  value instanceof Environment;

export default isEnvironment;
