import JBOInterpreter from ".";
import isJBOInterpreter from "./isJBOInterpreter";

describe ("JBOInterpreter `isJBOInterpreter` - detects if a given value is an JBOInterpreter", () => {
  test ("JBOInterpreter detected", () => {
    const interpreter = new JBOInterpreter ({}, true);

    expect (isJBOInterpreter (interpreter)).toBe (true);
  });
});