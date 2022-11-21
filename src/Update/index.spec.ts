import Update from ".";
import Table from "../Table";

describe ("Update type", () => {
  const columns = ["first_name", "last_name"];
  const playerData = { first_name: "John", last_name: "Doe" };

  test ("create Update", () => {
    const player = Table ("player");
    const update = Update (player, columns, playerData);

    expect (update.table).toEqual (player);
    expect (update.columns).toEqual (columns);
    expect (update.data).toEqual (playerData);
  });

  test ("create Update - defaults", () => {
    const player = Table ("player");
    const update = Update (player);

    expect (update.table).toEqual (player);
    expect (update.columns).toEqual ([]);
    expect (update.data).toEqual ({});
  });


  test ("compile Update", () => {
    const player = Table ("public.player");
    const update = Update (player, columns, playerData);

    const [query, values] = update.compile ();

    expect (query).toBe (
      "update public.player set first_name = $1, last_name = $2"
    );

    expect (values).toEqual (["John", "Doe"]);
  });

  test ("compile Update paramIdx 2", () => {
    const player = Table ("public.player");
    const update = Update (player, columns, playerData);

    const [query, values] = update.compile (2);

    expect (query).toBe (
      "update public.player set first_name = $3, last_name = $4"
    );

    expect (values).toEqual (["John", "Doe"]);
  });
});