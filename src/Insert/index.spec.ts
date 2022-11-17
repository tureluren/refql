import Insert from ".";
import { StringMap } from "../common/types";
import Table from "../Table";

describe ("Insert type", () => {
  const columns = ["first_name", "last_name"];
  const players: StringMap[] = [
    { first_name: "John", last_name: "Doe" },
    { first_name: "Jane", last_name: "Doe" }
  ];

  test ("create Insert", () => {
    const player = Table ("player");
    const insert = Insert (player, columns, players);

    expect (insert.table).toEqual (player);
    expect (insert.columns).toEqual (columns);
    expect (insert.data).toEqual (players);
  });

  test ("compile Insert", () => {
    const player = Table ("public.player");
    const insert = Insert (player, columns, players);

    const [query, values] = insert.compile (2);

    expect (query).toBe (
      "insert into public.player (first_name, last_name) values ($3, $4), ($5, $6)"
    );

    expect (values).toEqual (["John", "Doe", "Jane", "Doe"]);
  });
});