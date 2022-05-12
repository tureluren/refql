import Parser from ".";
import isParser from "./isParser";

describe ("Table `isParser` - detects if a given value is a Parser", () => {
  test ("Parser detected", () => {
    const parser = Parser ("snake", "camel", true, {});

    expect (isParser (parser)).toBe (true);
  });
});