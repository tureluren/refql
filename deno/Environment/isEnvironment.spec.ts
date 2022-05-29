import Environment from ".";
import isEnvironment from "./isEnvironment";

describe ("Environment `isEnvironment` - detects if a given value is an Environment", () => {
  test ("Parser detected", () => {
    const env = new Environment ({});

    expect (isEnvironment (env)).toBe (true);
  });
});