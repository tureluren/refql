import JBOInterpreter from ".";

const isJBOInterpreter = (value): value is JBOInterpreter =>
  value instanceof JBOInterpreter;

export default isJBOInterpreter;