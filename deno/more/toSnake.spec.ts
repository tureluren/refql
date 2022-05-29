import toSnake from "./toSnake";

describe ("more `toSnake` - converts a String to snake case", () => {
  test ("converted to snake case", () => {
    expect (toSnake ("player")).toBe ("player");
    expect (toSnake ("lastName")).toBe ("last_name");
    expect (toSnake ("last_name")).toBe ("last_name");
    expect (toSnake ("firstLastName")).toBe ("first_last_name");
    expect (toSnake ("first_lastName")).toBe ("first_last_name");
    expect (toSnake ("First_lastName")).toBe ("first_last_name");
  });
});