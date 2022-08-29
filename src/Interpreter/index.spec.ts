import Interpreter from ".";
import createEnv from "../Env/createEnv";
import { All, BelongsTo, Call, HasMany, Identifier, ManyToMany, Root, StringLiteral, Variable } from "../Parser/nodes";
import Raw from "../Raw";
import Table from "../Table";
import format from "../test/format";

/**
 * different case types
 * keywords use
 */

describe ("Interpreter", () => {
  const player = Table.of ("player");
  const goals = Table.of ("goal", "goals", "public");
  const team = Table.of ("team");
  const games = Table.of ("game", "games");
  const league = Table.of ("league");

  const allFields = All.of ("*");

  const playerRows = [
    { first_name: "John", last_name: "Doe", goalslref0: 1, teamlref0: 1, gameslref0: 1, gameslref1: 1 },
    { first_name: "Jane", last_name: "Doe", goalslref0: 2, teamlref0: 1, gameslref0: 2, gameslref1: 1 },
    { first_name: "Joe", last_name: "Schmoe", goalslref0: 3, teamlref0: 2, gameslref0: 3, gameslref1: 2 }
  ];

  const playerTeamRefs = {
    lrefs: [{ name: "team_id", as: "teamlref0" }],
    rrefs: [{ name: "id", as: "teamrref0" }],
    lxrefs: [],
    rxrefs: []
  };

  const playerGoalsRefs = {
    lrefs: [{ name: "id", as: "goalslref0" }],
    rrefs: [{ name: "player_id", as: "goalsrref0" }],
    lxrefs: [],
    rxrefs: []
  };

  const playerGamesRefs = {
    lrefs: [{ name: "id", as: "gameslref0" }],
    rrefs: [{ name: "id", as: "gamesrref0" }],
    lxrefs: [{ name: "player_id", as: "gameslxref0" }],
    rxrefs: [{ name: "game_id", as: "gamesrxref0" }]
  };

  const playerGamesRefs2 = {
    lrefs: [{ name: "id", as: "gameslref0" }, { name: "team_id", as: "gameslref1" }],
    rrefs: [{ name: "id", as: "gamesrref0" }, { name: "league_id", as: "gamesrref1" }],
    lxrefs: [{ name: "player_id", as: "gameslxref0" }, { name: "player_team_id", as: "gameslxref1" }],
    rxrefs: [{ name: "game_id", as: "gamesrxref0" }, { name: "game_league_id", as: "gamesrxref1" }]
  };

  test ("Root", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (undefined, kws);

    const identifier = Identifier.of ("id", "identifier", "text");
    const birthday = Identifier.of ("birthday");
    const lastName = Identifier.of ("last_name");
    const upperLastName = Call.of ("upper", [lastName]);
    const firstName = Identifier.of ("first_name");
    const space = StringLiteral.of (" ");
    const spaceRaw = Raw.of ("' '");
    const spaceVariable = Variable.of (spaceRaw);
    const fullName = Call.of ("concat", [upperLastName, space, spaceVariable, firstName], "full_name");

    const goalsAst = HasMany.of (goals, [allFields], {});
    const teamAst = BelongsTo.of (team, [allFields], {});
    const gamesAst = ManyToMany.of (games, [allFields], {});
    const rootAst = Root.of (
      player,
      [identifier, birthday, goalsAst, teamAst, gamesAst, fullName],
      kws
    );

    const { query, next } = interpret (rootAst, createEnv (player));

    expect (query).toBe (format (`
      select player.id::text as identifier, player.birthday,
        player.id as goalslref0, player.team_id as teamlref0, player.id as gameslref0,
        concat (upper (player.last_name), ' ', ' ', player.first_name) as full_name
      from player player
      where player.id = 1
    `));

    expect (next).toEqual ([
      { node: goalsAst, refs: playerGoalsRefs },
      { node: teamAst, refs: playerTeamRefs },
      { node: gamesAst, refs: playerGamesRefs }
    ]);
  });

  test ("HasMany", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (undefined, kws);

    const goalsAst = HasMany.of (goals, [allFields], { limit: 5, offset: 10 });

    const { query, next, values } = interpret (goalsAst, createEnv (goals, playerGoalsRefs), playerRows);

    expect (query).toBe (format (`
      select goals.*, goals.player_id as goalsrref0
      from public.goal goals
      where goals.player_id in ($1,$2,$3)
      limit 5
      offset 10
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("BelongsTo", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (undefined, kws);

    const leagueAst = BelongsTo.of (league, [allFields], { lref: "competition_id", rref: "identifier" });
    const teamAst = BelongsTo.of (team, [allFields, leagueAst], {});

    const { query, next, values } = interpret (teamAst, createEnv (team, playerTeamRefs), playerRows);

    expect (query).toBe (format (`
      select team.*, team.competition_id as leaguelref0, team.id as teamrref0
      from team team
      where team.id in ($1,$2)
    `));

    expect (values).toEqual ([1, 2]);

    expect (next).toEqual ([{
      node: leagueAst,
      refs: {
        lrefs: [{ name: "competition_id", as: "leaguelref0" }],
        rrefs: [{ name: "identifier", as: "leaguerref0" }],
        lxrefs: [],
        rxrefs: []
      }
    }]);
  });

  test ("ManyToMany", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (undefined, kws);

    const gamesAst = ManyToMany.of (games, [allFields], {});

    const { query, next, values } = interpret (gamesAst, createEnv (player, playerGamesRefs), playerRows);

    expect (query).toBe (format (`
      select games.*, games.id as gamesrref0,
        player_game.player_id as gameslxref0, player_game.game_id as gamesrxref0
      from game games 
      join player_game as player_game on player_game.game_id = games.id 
      where player_game.player_id in ($1,$2,$3)
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("ManyToMany - multi column ref", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (undefined, kws);

    const gamesAst = ManyToMany.of (games, [allFields], {
      lref: "id, team_id",
      lxref: "player_id, player_team_id",
      rref: "id, league_id",
      rxref: "game_id, game_league_id"
    });

    const { query, next, values } = interpret (gamesAst, createEnv (player, playerGamesRefs2), playerRows);

    expect (query).toBe (format (`
      select games.*, games.id as gamesrref0, games.league_id as gamesrref1,
        player_game.player_id as gameslxref0, player_game.player_team_id as gameslxref1,
        player_game.game_id as gamesrxref0, player_game.game_league_id as gamesrxref1
      from game games
      join player_game as player_game
        on player_game.game_id = games.id
        and player_game.game_league_id = games.league_id
      where player_game.player_id in ($1,$2,$3)
        and player_game.player_team_id in ($4,$5)
    `));

    expect (values).toEqual ([1, 2, 3, 1, 2]);
    expect (next).toEqual ([]);
  });
});