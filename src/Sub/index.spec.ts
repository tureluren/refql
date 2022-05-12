import Sub from ".";
import sql from "../SQLTag/sql";

describe ("Sub type", () => {
  test ("create Sub", () => {
    const includeGoals = t => sql`
      select * from "goal" "goal"
      where "goal".player_id = ${t}.id 
    `;
    const snippet = Sub ("goals", includeGoals);

    expect (snippet.as).toBe ("goals");
    expect (snippet.tag).toBe (includeGoals);
  });
});