import Select from ".";
import Table from "../Table";

describe ("Select type", () => {
  const columns = ["first_name", "last_name"];

  test ("create Select", () => {
    const player = Table ("player");
    const select = Select (player, columns);

    expect (select.table).toEqual (player);
    expect (select.columns).toEqual (columns);
  });

  test ("create Select - defaults", () => {
    const player = Table ("player");
    const select = Select (player);

    expect (select.table).toEqual (player);
    expect (select.columns).toEqual ([]);
  });

  test ("compile Select", () => {
    const player = Table ("public.player");
    const select = Select (player, columns);

    const [query] = select.compile ();

    expect (query).toBe (
      "select player.first_name, player.last_name from public.player"
    );
  });

  test ("compile Select all", () => {
    const select = Select (Table ("player"), ["*"]);

    const [query] = select.compile ();

    expect (query).toBe (
      "select player.* from player"
    );
  });
});