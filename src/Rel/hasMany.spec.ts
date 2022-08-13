import compile from "../more/compile";
import rql from "../RqlTag/rql";
import refQLConfig from "../test/refQLConfig";
import hasMany from "./hasMany";
import isRel from "./isRel";

describe ("Rel `hasMany` - create a hasMany Relation", () => {
  test ("hasMany relation created", () => {
    const getGoals = rql`
      goal {
        id
        minute
      } 
    `;

    const rel = hasMany (getGoals);

    expect (isRel (rel)).toBe (true);
    expect (rel.symbol).toBe ("<");
    expect (rel.tag).toBe (getGoals);
  });

  test ("hasMany relation included", () => {
    const getGoals = rql`
      goal {
        id
        minute
      } 
    `;

    const getPlayers = rql`
      player {
        id
        last_name
      }
    `.include (hasMany (getGoals));

    const expected = rql`
      player { 
        id 
        last_name
        < goal {
          id
          minute
        }
      }
    `;

    expect (compile (refQLConfig, getPlayers))
      .toEqual (compile (refQLConfig, expected));
  });
});