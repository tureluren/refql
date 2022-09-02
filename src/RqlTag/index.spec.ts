import { Pool } from "pg";
import RqlTag from ".";
import { All, HasMany, Identifier, Root } from "../Parser/nodes";
import { Player } from "../soccer";
import Table from "../Table";
import querier from "../test/querier";
import userConfig from "../test/userConfig";
import { TableNode } from "../types";
import rql from "./rql";

describe ("RqlTag type", () => {
  const player = Table.of ("player");
  const pool = new Pool (userConfig);

  afterAll (async () => {
    await pool.end ();
  });

  test ("create RqlTag", () => {
    const node = Root.of (player, [All.of ("*")], {});
    const tag = RqlTag.of (node);

    expect (tag.node).toEqual (node);
  });

  test ("Functor", () => {
    const tag = RqlTag.of (Root.of (player, [All.of ("*")], {}));

    expect (tag.map (n => n)).toEqual (tag);

    const addTeam = <Params> (node: TableNode<Params>) =>
      node.addMember (HasMany.of (node.table, node.members, node.keywords));

    const addLastName = <Params> (node: TableNode<Params>) =>
      node.addMember (Identifier.of ("last_name"));

    expect (tag.map (n => addLastName (addTeam (n))))
      .toEqual (tag.map (addTeam).map (addLastName));
  });

  test ("errors", async () => {
    const id = Identifier.of ("id");

    expect (() => (RqlTag as any).of (id))
      .toThrowError (new Error ("RqlTag should hold a Root node"));

    try {
      const tag = RqlTag.of (Root.of (player, [], {}));
      (tag as any).node = id;

      await tag.run ({}, () => Promise.resolve ([]), {});
    } catch (err: any) {
      expect (err.message).toBe ("You can only run a RqlTag that holds a Root node");
    }

    try {
      const tag = RqlTag.of (Root.of (player, [], {}));
      delete (tag as any).node.table;

      await tag.run ({}, () => Promise.resolve ([]), {});
    } catch (err: any) {
      expect (err.message).toBe ("The Root node has no table");
    }
  });

  test ("aggregate", async () => {
    const tag = rql`
      player (limit: 30) { 
        last_name
        - team { 
          name
          - league { name }
          < player: players {
            last_name
          }
        }
        x game:games { 
          result 
        }
      }
    `;

    // try different casetype
    const players = await tag.run<Player> ({ caseType: "snake" }, querier (pool), {});
    const player = players[0];
    const team = players[0].team;
    const teammate = team.players[0];
    const league = players[0].team.league;
    const game = players[0].games[0];

    expect (Object.keys (player).length).toBe (3);
    expect (player).toHaveProperty ("last_name");
    expect (teammate).toHaveProperty ("last_name");
    expect (team).toHaveProperty ("name");
    expect (league).toHaveProperty ("name");
    expect (game).toHaveProperty ("result");

    expect (players.length).toBe (30);
  });
});