import Interpreter from ".";
import createEnv from "../Env/createEnv";
import {
  All, BelongsTo, BooleanLiteral,
  Call, HasMany, Identifier, ManyToMany,
  NullLiteral, NumericLiteral, Root,
  StringLiteral, Variable
} from "../Parser/nodes";
import Raw from "../Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import format from "../test/format";

describe ("Interpreter", () => {
  const player = Table ("player");
  const goals = Table ("goal", "goals", "public");
  const team = Table ("team");
  const games = Table ("game", "games");
  const league = Table ("league");

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
    const interpret = Interpreter (kws);

    const identifier = Identifier.of ("id", "identifier", "text");
    const birthday = Identifier.of ("birthday");
    const lastName = Identifier.of ("last_name");
    const upperLastName = Call.of ("upper", [lastName]);
    const firstName = Identifier.of ("first_name");
    const space = StringLiteral.of (" ");
    const spaceRaw = Raw ("' '");
    const spaceVariable = Variable.of (spaceRaw);
    const sqlId = Variable.of (sql`player.id::text`);
    const fullNameAndId = Call.of (
      "concat",
      [upperLastName, space, spaceVariable, firstName, sqlId],
      "full_name_and_id"
    );

    const goalsNode = HasMany.of (goals, [allFields], {});
    const teamNode = BelongsTo.of (team, [allFields], {});
    const gamesNode = ManyToMany.of (games, [allFields], {});
    const rootNode = Root.of (
      player,
      [identifier, birthday, goalsNode, teamNode, gamesNode, fullNameAndId],
      kws
    );

    const { query, next } = interpret (rootNode, createEnv (player));

    expect (query).toBe (format (`
      select player.id::text as identifier, player.birthday,
        player.id as goalslref0, player.team_id as teamlref0, player.id as gameslref0,
        concat (upper (player.last_name), ' ', ' ', player.first_name, player.id::text) as full_name_and_id
      from player player
      where player.id = $1
    `));

    expect (next).toEqual ([
      { node: goalsNode, refs: playerGoalsRefs },
      { node: teamNode, refs: playerTeamRefs },
      { node: gamesNode, refs: playerGamesRefs }
    ]);
  });

  test ("Root - provided refs", () => {
    const interpret = Interpreter ({});

    const goalsNode = HasMany.of (goals, [allFields], { lref: "ID", rref: "PLAYERID" });
    const teamNode = BelongsTo.of (team, [allFields], { lref: "TEAMID", rref: "ID" });
    const gamesNode = ManyToMany.of (games, [allFields], {
      lref: "ID", lxref: "PLAYERID", rxref: "GAMEID", rref: "ID"
    });

    const rootNode = Root.of (player, [goalsNode, teamNode, gamesNode], {});

    const { query, next } = interpret (rootNode, createEnv (player));

    expect (query).toBe (format (`
      select player.ID as goalslref0, player.TEAMID as teamlref0, player.ID as gameslref0
      from player player
    `));

    const goalsRefs = {
      lrefs: [{ name: "ID", as: "goalslref0" }],
      rrefs: [{ name: "PLAYERID", as: "goalsrref0" }],
      lxrefs: [],
      rxrefs: []
    };

    const teamRefs = {
      lrefs: [{ name: "TEAMID", as: "teamlref0" }],
      rrefs: [{ name: "ID", as: "teamrref0" }],
      lxrefs: [],
      rxrefs: []
    };

    const gamesRefs = {
      lrefs: [{ name: "ID", as: "gameslref0" }],
      rrefs: [{ name: "ID", as: "gamesrref0" }],
      lxrefs: [{ name: "PLAYERID", as: "gameslxref0" }],
      rxrefs: [{ name: "GAMEID", as: "gamesrxref0" }]
    };

    expect (next).toEqual ([
      { node: goalsNode, refs: goalsRefs },
      { node: teamNode, refs: teamRefs },
      { node: gamesNode, refs: gamesRefs }
    ]);
  });

  test ("HasMany", () => {
    const interpret = Interpreter ({});

    const goalsNode = HasMany.of (goals, [allFields], { limit: 5, offset: 10 });

    const { query, next, values } = interpret (goalsNode, createEnv (goals, playerGoalsRefs), playerRows);

    expect (query).toBe (format (`
      select goals.*, goals.player_id as goalsrref0
      from public.goal goals
      where goals.player_id in ($1,$2,$3)
      limit $4
      offset $5
    `));

    expect (values).toEqual ([1, 2, 3, 5, 10]);
    expect (next).toEqual ([]);
  });

  test ("BelongsTo", () => {
    const interpret = Interpreter ({});

    const leagueNode = BelongsTo.of (league, [allFields], { lref: "competition_id", rref: "identifier" });

    const byName = Variable.of (sql`where team.name like 'FC%'`);

    const teamNode = BelongsTo.of (team, [allFields, leagueNode, byName], {});

    const { query, next, values } = interpret (teamNode, createEnv (team, playerTeamRefs), playerRows);

    expect (query).toBe (format (`
      select team.*, team.competition_id as leaguelref0, team.id as teamrref0
      from team team
      where team.id in ($1,$2)
      and team.name like 'FC%'
    `));

    expect (values).toEqual ([1, 2]);

    expect (next).toEqual ([{
      node: leagueNode,
      refs: {
        lrefs: [{ name: "competition_id", as: "leaguelref0" }],
        rrefs: [{ name: "identifier", as: "leaguerref0" }],
        lxrefs: [],
        rxrefs: []
      }
    }]);
  });

  test ("ManyToMany", () => {
    const interpret = Interpreter ({});

    const gamesNode = ManyToMany.of (games, [allFields], { xtable: "PLAYERGAME" });

    const { query, next, values } = interpret (gamesNode, createEnv (player, playerGamesRefs), playerRows);

    expect (query).toBe (format (`
      select games.*, PLAYERGAME.player_id as gameslxref0
      from game games 
      join PLAYERGAME as PLAYERGAME on PLAYERGAME.game_id = games.id 
      where PLAYERGAME.player_id in ($1,$2,$3)
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("ManyToMany - multi column ref", () => {
    const interpret = Interpreter ({});

    const gamesNode = ManyToMany.of (games, [allFields], {});

    const { query, next, values } = interpret (gamesNode, createEnv (player, playerGamesRefs2), playerRows);

    expect (query).toBe (format (`
      select games.*, 
        player_game.player_id as gameslxref0, player_game.player_team_id as gameslxref1
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

  test ("literals and variables", () => {
    type Params = {id: number; three: number; limit: number};
    const interpret = Interpreter<Params> ({ id: 1, three: 3, limit: 5 });
    const one = StringLiteral.of ("1", "one", "int");
    const two = NumericLiteral.of (2, "two", "text");
    const three = Variable.of<Params> (p => p.three, "three", "text");
    const t = BooleanLiteral.of (true, "t", "text");
    const f = BooleanLiteral.of (false, "f", "text");
    const n = NullLiteral.of (null, "n", "text");
    const goalCount = Variable.of (sql`
      select count (*)
      from goal
      where player_id = player.id
    `, "goal_count");

    const byId = Variable.of (sql<Params>`where ${(_p, t) => t}.id = ${p => p.id}`);

    const rootNode = Root.of<Params> (
      player,
      [one, two, three, t, f, n, goalCount, byId],
      { limit: p => p.limit }
    );

    const { query, values } = interpret (rootNode, createEnv (player));

    expect (query).toBe (format (`
      select 
        '1'::int as one, 2::text as two, $1::text as three,
        true::text as t, false::text as f, null::text as n,
        (select count (*) from goal where player_id = player.id) as goal_count
      from player player
      where player.id = $2
      limit $3
    `));

    expect (values).toEqual ([3, 1, 5]);
  });
});