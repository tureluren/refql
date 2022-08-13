import Rel from ".";
import rql from "../RqlTag/rql";
import isRel from "./isRel";

describe ("Rel `isRel` - detects if a given value is a Rel", () => {
  test ("Rel detected", () => {
    const snippet = new Rel ("-", rql`team { id name }`);

    expect (isRel (snippet)).toBe (true);
  });
});