import compile from "../more/compile";
import rql from "../RQLTag/rql";
import refQLConfig from "../test/refQLConfig";
import belongsTo from "./belongsTo";
import isRel from "./isRel";

describe ("Rel `belongsTo` - create a belongsTo Relation", () => {
  test ("belongsTo relation created", () => {
    const getTeam = rql`
      team {
        id
        name
      } 
    `;

    const rel = belongsTo (getTeam);

    expect (isRel (rel)).toBe (true);
    expect (rel.symbol).toBe ("-");
    expect (rel.tag).toBe (getTeam);
  });

  test ("belongsTo relation included", () => {
    const getTeam = rql`
      team {
        id
        name
      } 
    `;

    const getPlayers = rql`
      player {
        id
        last_name
      }
    `.include (belongsTo (getTeam));

    const expected = rql`
      player { 
        id 
        last_name
        - team {
          id
          name
        }
      }
    `;

    expect (compile (refQLConfig, getPlayers))
      .toEqual (compile (refQLConfig, expected));
  });
});