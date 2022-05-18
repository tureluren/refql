import { Pool } from "pg";
import RefQL from ".";
import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import format from "../test/format";
import querier from "../test/querier";
import userConfig from "../test/userConfig";

const pool = new Pool (userConfig);

describe ("RefQL", () => {
  afterAll (async () => {
    await pool.end ();
  });

  test ("query multiple rows", async () => {
    const { query } = RefQL ({ detectRefs: false }, querier (pool));

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

    const { query1 } = RefQL ({
      caseTypeJS: "camel",
      caseTypeDB: "snake",
      debug
    }, querier (pool));

    const player = await query1 (rql`
      player {
        id lastName
        ${byId (1)}
      }
    `);

    expect (player).toHaveProperty ("id");
    expect (player).toHaveProperty ("lastName");
  });

  test ("query errors", async () => {
    const byId = id => sql`where id = ${id}`;

    const { query1 } = RefQL ({}, querier (pool));

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
  });

  test ("connection error, `onSetupError` provided", done => {
    const pool2 = new Pool ({ ...userConfig, database: "football" });

    RefQL ({
      onSetupError: err => {
        expect (err.message).toBe ('database "football" does not exist');
        pool2.end ().then (() => {
          done ();
        });
      }
    }, querier (pool2));

  });
});