import isRqlTag from "./isRqlTag";
import rql from "./rql";

describe ("RqlTag `rql` - tagged template to create a RqlTag", () => {
  test ("create RqlTag", () => {
    const rqlTag = rql`player { id lastName }`;

    expect (isRqlTag (rqlTag)).toBe (true);
  });
});