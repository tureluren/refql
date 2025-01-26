import { Pool } from "pg";
import {
  BelongsTo, BooleanProp,
  DateProp, HasMany, Limit, NumberProp,
  Offset,
  Prop,
  Raw,
  setDefaultQuerier, sql,
  StringProp, Table,
  Value,
  Values,
  Values2D
} from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);

const Team = Table ("public.team", [
  NumberProp ("id"),
  StringProp ("name"),
  BooleanProp ("active"),
  NumberProp ("leagueId", "league_id"),

  // A game will usually have two refs to a team table
  // which means u're gonna end up with two arrays (homeTeams and awayTeams)
  // U will have to determine which array contains the last game after the result
  // comes back from the db.
  HasMany ("homeGames", "game", { rRef: "home_team_id" }),
  HasMany ("awayGames", "game", { rRef: "away_team_id" }),

  // // Right now I would define a count in this way.
  // // The problem is that it's not that typesafe since it's using
  // // the not so typesafe `sql`function.
  NumberProp ("playerCount", sql`
    select cast(count(*) as int) from player
    where player.team_id = team.id
  `)
]);

const Game = Table ("game", [
  NumberProp ("id"),
  StringProp ("result"),
  NumberProp ("homeTeamId", "home_team_id"),
  NumberProp ("awayTeamId", "away_team_id"),
  BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
  BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
  DateProp ("date")
]);

// const playerCount = NumberProp ("playerCount", sql`
//   select cast(count(*) as int) from player
//   where player.team_id = team.id
// `);

const { id, name, playerCount } = Team.props;

const teamById = Team ([
  "name",
  playerCount.eq (11),
  id.in ([1, 2, 3])
]);

teamById ({ eqName: false, name: "FC Ratuhuw" }, querier).then (ts => console.log (ts));

// const teamById = sql`
//   select id, name, ${Raw ("active")} from team
//   where id = ${p => p.id}
//   or id = ${2}
//   or id in ${Values ([3, 4, 5])}
// `;

// teamById ({ id: 1 }).then (console.log);


// REMOVE all -> *
// count enzo toevoegen om subselects zonder sqlTag te doen
// insert, update
// register subselect to Player ?