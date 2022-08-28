import Interpreter from ".";
import createEnv from "../Env/createEnv";
import { All, BelongsTo, HasMany, Identifier, ManyToMany, Root } from "../Parser/nodes";
import Table from "../Table";
import format from "../test/format";

/**
 * different case types
 * multiple lkeys
 * async multiple queries
 * unique list
 * keywords use
 * public
 */

describe ("Interpreter", () => {
  test ("Root", () => {
    const kws = {};
    const interpret = Interpreter (undefined, kws);

    const player = Table.of ("player");
    const identifier = Identifier.of ("id", "identifier", "text");
    const birthday = Identifier.of ("birthday");
    const goals = Table.of ("goal", "goals");
    const team = Table.of ("team");
    const games = Table.of ("game", "games");
    const allFields = All.of ("*");
    const goalsAst = HasMany.of (goals, [allFields], kws);
    const teamAst = BelongsTo.of (team, [allFields], kws);
    const gamesAst = ManyToMany.of (games, [allFields], kws);

    const ast = Root.of (
      player,
      [identifier, birthday, goalsAst, teamAst, gamesAst],
      kws
    );

    const { query } = interpret (ast, createEnv (player));

    expect (query).toBe (format (`
      select player.id::text as identifier, player.birthday,
        player.id as goalslref0, player.team_id as teamlref0, player.id as gameslref0
      from player player
    `));
  });

  // test ("Has Many", () => {
  //   const kws = {};
  //   const interpret = Interpreter (undefined, kws);

  //   const player = Table.of ("player");
  //   const identifier = Identifier.of ("id", "identifier", "text");
  //   const birthday = Identifier.of ("birthday");

  //   const positionAst = BelongsTo.of (position, [allPositionFields], {});
  //   const playersAst = HasMany.of (players, [lastName, positionAst], {});

  //   const { query } = interpret (ast, createEnv (player));

  //   expect (query).toBe (format (`
  //     select player.id::text as identifier, player.birthday
  //     from player player
  //   `));
  // });
});