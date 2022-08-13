import compile from "../more/compile";
import rql from "../RqlTag/rql";
import refQLConfig from "../test/refQLConfig";
import manyToMany from "./manyToMany";
import isRel from "./isRel";

describe ("Rel `manyToMany` - create a manyToMany Relation", () => {
  test ("manyToMany relation created", () => {
    const getGames = rql`
      game {
        id
        result
      } 
    `;

    const rel = manyToMany (getGames);

    expect (isRel (rel)).toBe (true);
    expect (rel.symbol).toBe ("x");
    expect (rel.tag).toBe (getGames);
  });

  test ("manyToMany relation included", () => {
    const getGames = rql`
      game {
        id
        result
      } 
    `;

    const getPlayers = rql`
      player {
        id
        last_name
      }
    `.include (manyToMany (getGames));

    const expected = rql`
      player { 
        id 
        last_name
        x game {
          id
          result
        }
      }
    `;

    expect (compile (refQLConfig, getPlayers))
      .toEqual (compile (refQLConfig, expected));
  });
});