import Select from ".";
import Table from "../Table";

describe ("Select type", () => {
  const player = Table ("player");
  const columns = ["first_name", "last_name"];

  test ("create Select", () => {
    const select = Select ("player", columns);

    expect (select.table).toEqual (player);
    expect (select.columns).toEqual (columns);
  });

  test ("compile Select", () => {
    const select = Select (player, columns);

    const [selectStr] = select.compile ();

    expect (selectStr).toBe (
      "select player.first_name, player.last_name from player player"
    );

    const selectAll = Select (player);

    const [selectAllStr] = selectAll.compile ();

    expect (selectAllStr).toBe (
      "select player.* from player player"
    );
  });
});