import convertCase from "./convertCase";

describe ("more `convertCase` - converts string to specified type case", () => {
  test ("converted to camel case", () => {
    expect (convertCase ("camel", "first_name")).toEqual ("firstName");
  });

  test ("converted to snake case", () => {
    expect (convertCase ("snake", "firstName")).toEqual ("first_name");
  });
});