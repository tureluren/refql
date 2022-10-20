import Select from ".";
import Table from "../Table";

describe ("Select type", () => {
  const columns = ["first_name", "last_name"];

  test ("create Select", () => {
    const select = Select (Table ("player"), columns);

    expect (select.table).toEqual (Table ("player"));
    expect (select.columns).toEqual (columns);
  });

  test ("compile Select", () => {
    const player = Table ("player", "p", "public");
    const select = Select (player, columns);

    const [query] = select.compile ();

    expect (query).toBe (
      "select p.first_name, p.last_name from public.player p"
    );
  });

  test ("compile Select all", () => {
    const select = Select (Table ("player"), ["*"]);

    const [query] = select.compile ();

    expect (query).toBe (
      "select player.* from player player"
    );
  });
});