import Sub from ".";
import sql from "../SQLTag/sql";
import Table from "../Table";

describe ("Sub type", () => {
  test ("create Sub", () => {
    const includeGoals = (t: Table) => sql`
      select * from "goal" "goal"
      where "goal".player_id = ${t}.id 
    `;
    const snippet = new Sub ("goals", includeGoals);

    expect (snippet.as).toBe ("goals");
    expect (snippet.tag).toBe (includeGoals);
  });
});