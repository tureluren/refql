import rql from "../RqlTag/rql";
import isRel from "./isRel";
import rel from "./rel";

describe ("Rel `rel` - create a Rel type", () => {
  test ("Rel type created", () => {
    const getTeam = rql`
      team {
        id
        name
      } 
    `;
    const belongsToTeam = rel ("-") (getTeam);

    expect (isRel (belongsToTeam)).toBe (true);
    expect (belongsToTeam.symbol).toBe ("-");
    expect (belongsToTeam.tag).toBe (getTeam);
  });
});