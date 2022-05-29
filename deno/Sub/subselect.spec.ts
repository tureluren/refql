import compile from "../more/compile";
import isSub from "../Sub/isSub";
import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import refQLConfig from "../test/refQLConfig";
import subselect from "./subselect";
import Table from "../Table";

describe ("Sub `subselect` - create an includable subselect", () => {
  test ("includable subselect created", () => {
    const getGoalCount = (t: Table) => sql`
      select count(*) from "goal"
      where "goal".player_id = ${t}.id
    `;

    const sub = subselect ("goals", getGoalCount);

    expect (isSub (sub)).toBe (true);
    expect (sub.as).toBe ("goals");
    expect (sub.tag).toBe (getGoalCount);
  });

  test ("includable subselect included", () => {
    const getGoalCount = (t: Table) => sql`
      select count(*) from "goal"
      where "goal".player_id = ${t}.id
    `;

    const getPlayers = rql`
      player {
        id
        last_name
      }
    `.include (subselect ("goals", getGoalCount));

    const expected = rql`
      player {
        id
        last_name
        & goals ${getGoalCount}
      }
    `;

    expect (compile (refQLConfig, getPlayers))
      .toEqual (compile (refQLConfig, expected));
  });
});