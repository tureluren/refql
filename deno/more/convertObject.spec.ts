import convertObject from "./convertObject";

describe ("more `convertObject` - converts Object keys to specified type case", () => {
  test ("converted to camel case", () => {
    expect (
      convertObject ("camel", { first_name: "John", last_name: "Doe" })
    ).toEqual ({ firstName: "John", lastName: "Doe" });
  });

  test ("converted to snake case", () => {
    expect (
      convertObject ("snake", { firstName: "John", lastName: "Doe" })
    ).toEqual ({ first_name: "John", last_name: "Doe" });
  });
});