import Sub from ".";
import sql from "../SQLTag/sql";
import isSub from "./isSub";

describe ("Sub `isSub` - detects if a given value is a Sub", () => {
  test ("Sub detected", () => {
    const includeGoals = t => sql`
      select * from "goal" "goal"
      where "goal".player_id = ${t}.id 
    `;
    const snippet = Sub ("goals", includeGoals);

    expect (isSub (snippet)).toBe (true);
  });
});