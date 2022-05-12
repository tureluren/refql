import Rel from ".";
import rql from "../RQLTag/rql";

describe ("Rel type", () => {
  test ("create Rel", () => {
    const includeTeam = rql`team { id name }`;
    const snippet = Rel ("-") (includeTeam);

    expect (snippet.symbol).toBe ("-");
    expect (snippet.tag).toBe (includeTeam);
  });
});