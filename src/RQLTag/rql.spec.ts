import isRQLTag from "./isRQLTag";
import rql from "./rql";

describe ("RQLTag `rql` - tagged template to create a RQLTag", () => {
  test ("create RQLTag", () => {
    const rqlTag = rql`player { id lastName }`;

    expect (isRQLTag (rqlTag)).toBe (true);
  });
});