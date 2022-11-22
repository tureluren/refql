import Interpreter from ".";
import createEnv from "../Env/createEnv";
import {
  all,
  BelongsTo, BelongsToMany, BooleanLiteral,
  Call, HasMany, HasOne, Identifier,
  NullLiteral, NumericLiteral, Root,
  StringLiteral, Variable
} from "../nodes";
import Raw from "../Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import format from "../test/format";

describe ("Interpreter", () => {
  const playerRows = [
    { first_name: "John", last_name: "Doe", goalslref0: 1, teamlref0: 1, gameslref0: 1, gameslref1: 1 },
    { first_name: "Jane", last_name: "Doe", goalslref0: 2, teamlref0: 1, gameslref0: 2, gameslref1: 1 },
    { first_name: "Joe", last_name: "Schmoe", goalslref0: 3, teamlref0: 2, gameslref0: 3, gameslref1: 2 }
  ];

  const playerTeamRefs = {
    lRefs: [{ name: "team_id", as: "teamlref0" }],
    rRefs: [{ name: "id", as: "teamrref0" }],
    lxRefs: [],
    rxRefs: []
  };

  const playerGoalsRefs = {
    lRefs: [{ name: "id", as: "goalslref0" }],
    rRefs: [{ name: "player_id", as: "goalsrref0" }],
    lxRefs: [],
    rxRefs: []
  };

  const playerGamesRefs = {
    lRefs: [{ name: "id", as: "gameslref0" }],
    rRefs: [{ name: "id", as: "gamesrref0" }],
    lxRefs: [{ name: "player_id", as: "gameslxref0" }],
    rxRefs: [{ name: "game_id", as: "gamesrxref0" }]
  };

  const playerGamesRefs2 = {
    lRefs: [{ name: "id", as: "gameslref0" }, { name: "team_id", as: "gameslref1" }],
    rRefs: [{ name: "id", as: "gamesrref0" }, { name: "league_id", as: "gamesrref1" }],
    lxRefs: [{ name: "player_id", as: "gameslxref0" }, { name: "player_team_id", as: "gameslxref1" }],
    rxRefs: [{ name: "game_id", as: "gamesrxref0" }, { name: "game_league_id", as: "gamesrxref1" }]
  };

  test ("Root", () => {
    const kws = { id: 1 };
    const interpret = Interpreter (kws);

    const identifier = Identifier ("id", "identifier", "text");
    const birthday = Identifier ("birthday");
    const lastName = Identifier ("last_name");
    const upperLastName = Call ("upper", [lastName]);
    const firstName = Identifier ("first_name");
    const space = StringLiteral (" ");
    const spaceRaw = Raw ("' '");
    const spaceVariable = Variable (spaceRaw);
    const sqlId = Variable (sql`player.id::text`);
    const fullNameAndId = Call (
      "concat",
      [upperLastName, space, spaceVariable, firstName, sqlId],
      "full_name_and_id"
    );

    const goalsNode = HasMany (
      Table ("goal"), { as: "goals", lRef: "id", rRef: "player_id" }, [all]
    );
    const teamNode = BelongsTo (
      Table ("team"), { as: "team", lRef: "team_id", rRef: "id" }, [all]
    );
    const gamesNode = BelongsToMany (
      Table ("game"), { as: "games", lRef: "id", lxRef: "player_id", rxRef: "game_id", rRef: "id", xTable: Table ("game_player") }, [all]
    );
    const rootNode = Root (
      Table ("player"),
      [identifier, birthday, goalsNode, teamNode, gamesNode, fullNameAndId]
    );

    const { query, next } = interpret (rootNode, createEnv (Table ("player")));

    expect (query).toBe (format (`
      select player.id::text as identifier, player.birthday,
        player.id as goalslref0, player.team_id as teamlref0, player.id as gameslref0,
        concat (upper (player.last_name), ' ', ' ', player.first_name, (player.id::text)) as full_name_and_id
      from player
    `));

    expect (next).toEqual ([
      { node: goalsNode, refs: playerGoalsRefs },
      { node: teamNode, refs: playerTeamRefs },
      { node: gamesNode, refs: playerGamesRefs }
    ]);
  });

  test ("HasMany", () => {
    const interpret = Interpreter ({});

    const goalsNode = HasMany (
      Table ("public.goal"), { as: "goals", lRef: "id", rRef: "player_id" }, [all]
    );

    const { query, next, values } = interpret (goalsNode, createEnv (Table ("public.goal"), playerGoalsRefs), playerRows);

    expect (query).toBe (format (`
      select goal.*, goal.player_id as goalsrref0
      from public.goal
      where goal.player_id in ($1, $2, $3)
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("HasOne", () => {
    const interpret = Interpreter ({});

    const goalsNode = HasOne (
      Table ("rating"), { as: "rating", lRef: "id", rRef: "player_id" }, [all]
    );

    const { query, next, values } = interpret (goalsNode, createEnv (Table ("rating"), playerGoalsRefs), playerRows);

    expect (query).toBe (format (`
      select rating.*, rating.player_id as goalsrref0
      from rating
      where rating.player_id in ($1, $2, $3)
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("BelongsTo", () => {
    const interpret = Interpreter ({});

    const leagueNode = BelongsTo (
      Table ("league"), { as: "league", lRef: "competition_id", rRef: "identifier" }, [all]
    );

    const byName = Variable (sql`where team.name like 'FC%'`);

    const teamNode = BelongsTo (
      Table ("team"), { as: "team", lRef: "team_id", rRef: "id" }, [all, leagueNode, byName]
    );

    const { query, next, values } = interpret (teamNode, createEnv (Table ("team"), playerTeamRefs), playerRows);

    expect (query).toBe (format (`
      select team.*, team.competition_id as leaguelref0, team.id as teamrref0
      from team
      where team.id in ($1, $2)
      and team.name like 'FC%'
    `));

    expect (values).toEqual ([1, 2]);

    expect (next).toEqual ([{
      node: leagueNode,
      refs: {
        lRefs: [{ name: "competition_id", as: "leaguelref0" }],
        rRefs: [{ name: "identifier", as: "leaguerref0" }],
        lxRefs: [],
        rxRefs: []
      }
    }]);
  });

  test ("BelongsToMany", () => {
    const interpret = Interpreter ({});

    const gamesNode = BelongsToMany (
      Table ("game"),
      { as: "games", lRef: "id", lxRef: "player_id", rxRef: "game_id", rRef: "id", xTable: Table ("GAMEPLAYER") },
      [all]
    );

    const { query, next, values } = interpret (gamesNode, createEnv (Table ("game"), playerGamesRefs), playerRows);

    expect (query).toBe (format (`
      select distinct game.*, GAMEPLAYER.player_id as gameslxref0
      from game
      join GAMEPLAYER as GAMEPLAYER on GAMEPLAYER.game_id = game.id
      where GAMEPLAYER.player_id in ($1, $2, $3)
    `));

    expect (values).toEqual ([1, 2, 3]);
    expect (next).toEqual ([]);
  });

  test ("BelongsToMany - multi column ref", () => {
    const interpret = Interpreter ({});

    const gamesNode = BelongsToMany (
      Table ("game"),
      { as: "games", lRef: "id", lxRef: "player_id", rxRef: "game_id", rRef: "id", xTable: Table ("game_player") },
      [all]
    );

    const { query, next, values } = interpret (gamesNode, createEnv (Table ("player"), playerGamesRefs2), playerRows);

    expect (query).toBe (format (`
      select distinct game.*,
        game_player.player_id as gameslxref0, game_player.player_team_id as gameslxref1
      from game
      join game_player as game_player
        on game_player.game_id = game.id
        and game_player.game_league_id = game.league_id
      where game_player.player_id in ($1, $2, $3)
        and game_player.player_team_id in ($4, $5)
    `));

    expect (values).toEqual ([1, 2, 3, 1, 2]);
    expect (next).toEqual ([]);
  });

  test ("literals and variables", () => {
    type Params = {id: number; three: number};
    const interpret = Interpreter<Params> ({ id: 1, three: 3 });
    const one = StringLiteral ("1", "one", "int");
    const two = NumericLiteral (2, "two", "text");
    const three = Variable<Params> (p => p.three, "three", "text");
    const t = BooleanLiteral (true, "t", "text");
    const f = BooleanLiteral (false, "f", "text");
    const n = NullLiteral (null, "n", "text");
    const goalCount = Variable (sql`
      select count (*)
      from goal
      where player_id = player.id
    `, "goal_count");

    const byId = Variable (sql<Params>`where player.id = ${p => p.id}`);

    const rootNode = Root<Params> (
      Table ("player"),
      [one, two, three, t, f, n, goalCount, byId]
    );

    const { query, values } = interpret (rootNode, createEnv (Table ("player")));

    expect (query).toBe (format (`
      select
        '1'::int as one, 2::text as two, $1::text as three,
        true::text as t, false::text as f, null::text as n,
        (select count (*) from goal where player_id = player.id) as goal_count
      from player
      where player.id = $2
    `));

    expect (values).toEqual ([3, 1]);
  });
});