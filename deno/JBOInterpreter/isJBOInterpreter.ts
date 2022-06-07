import JBOInterpreter from "./index.ts";

const isJBOInterpreter = (value: any): value is JBOInterpreter =>
  value instanceof JBOInterpreter;

export default isJBOInterpreter;