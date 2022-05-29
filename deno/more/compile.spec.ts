import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import refQLConfig from "../test/refQLConfig";
import format from "../test/format";
import compile from "./compile";

describe ("more `compile` - compiles a RQLTag or a SQLTag to a query and values", () => {
  test ("RQLTag compiled", () => {
    const getPlayer = (id: number) => rql`
      player {
        id
        last_name
        ${sql`
          where id = ${id} 
        `}
      } 
    `;

    const [query, values] = compile (refQLConfig, getPlayer (1));

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id,
        'lastName', "player".last_name
      )
      from "player" "player"
      where id = $1
    `));

    expect (values).toEqual ([1]);
  });

  test ("SQLTag compiled", () => {
    const getPlayer = (id: number) => sql`
      select id, last_name
      from player
      where id = ${id} 
    `;

    const [query, values] = compile (refQLConfig, getPlayer (1));

    expect (query).toBe (format (`
      select id, last_name
      from player
      where id = $1
    `));

    expect (values).toEqual ([1]);
  });
});