import Update from ".";
import Table from "../Table";

describe ("Update type", () => {
  const columns = ["first_name", "last_name"];
  const playerData = { first_name: "John", last_name: "Doe" };

  test ("create Update", () => {
    const update = Update (Table ("player"), columns, playerData);

    expect (update.table).toEqual (Table ("player"));
    expect (update.columns).toEqual (columns);
    expect (update.data).toEqual (playerData);
  });

  test ("compile Update", () => {
    const player = Table ("player", "p", "public");
    const update = Update (player, columns, playerData);

    const [query, values] = update.compile (2);

    expect (query).toBe (
      "update public.player set first_name = $3, last_name = $4"
    );

    expect (values).toEqual (["John", "Doe"]);
  });
});