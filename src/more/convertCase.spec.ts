import convertCase from "./convertCase";

describe ("more `convertCase` - converts string to specified type case", () => {
  test ("camel case", () => {
    expect (convertCase ("camel", "first_name")).toEqual ("firstName");
  });

  test ("snake case", () => {
    expect (convertCase ("snake", "firstName")).toEqual ("first_name");
  });
});