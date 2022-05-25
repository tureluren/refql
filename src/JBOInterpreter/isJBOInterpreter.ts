import JBOInterpreter from ".";

const isJBOInterpreter = (value: any): value is JBOInterpreter =>
  value instanceof JBOInterpreter;

export default isJBOInterpreter;