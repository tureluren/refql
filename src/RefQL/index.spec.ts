import RefQL from ".";
import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import format from "../test/format";
import userConfig from "../test/userConfig";

describe ("RefQL", () => {
  test ("query multiple rows", async () => {
    const { query, pool } = RefQL (userConfig);

    const res = await query (rql`
      player {
        id last_name
        ${sql`limit 30`}
      }
    `);

    expect (res.length).toBe (30);

    const player = res[0];

    expect (player).toHaveProperty ("id");
    expect (player).toHaveProperty ("last_name");

    await pool.end ();
  });

  test ("query one row", async () => {
    const byId = id => sql`where id = ${id}`;

    const debug = (query, values, ast) => {
      expect (query).toBe (format (`
        select json_build_object(
          'id', "player".id,
          'lastName', "player".last_name)
        from "player" "player"
        where id = $1
      `));

      expect (values).toEqual ([1]);

      expect (ast).toEqual ({
        type: "AST",
        name: "player",
        as: "player",
        members: [
          { type: "Identifier", name: "id", as: "id" },
          { type: "Identifier", name: "last_name", as: "lastName" },
          { type: "Variable", idx: 0, value: byId (1) }
        ]
      });
    };

    const { query1, pool } = RefQL ({
      ...userConfig,
      caseTypeJS: "camel",
      caseTypeDB: "snake",
      debug
    });

    const player = await query1 (rql`
      player {
        id lastName
        ${byId (1)}
      }
    `);

    expect (player).toHaveProperty ("id");
    expect (player).toHaveProperty ("lastName");

    await pool.end ();
  });

  test ("query errors", async () => {
    const byId = id => sql`where id = ${id}`;

    const { query1, pool } = RefQL (userConfig);

    try {
      await query1 (rql`
        player {
          id name
          ${byId (1)}
        }
      `);
    } catch (err: any) {
      expect (err.message).toBe ("column player.name does not exist");
    }

    await pool.end ();
  });

  test ("connection error", done => {
    const { pool } = RefQL ({ ...userConfig, database: "football" });

    pool.on ("error", err => {
      expect (err.message).toBe ('database "football" does not exist');

      pool.end ().then (() => {
        done ();
      });
    });
  });

  test ("query when ready", done => {
    const byId = id => sql`where id = ${id}`;

    const { pool, query1 } = RefQL (userConfig);

    pool.on ("ready", () => {
      query1 (rql`
        player { id last_name ${byId (1)} }
      `).then (player => {

        expect (player).toHaveProperty ("id");
        expect (player).toHaveProperty ("last_name");

        pool.end ().then (() => {
          done ();
        });
      });

    });
  });
});