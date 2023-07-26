import { Pool } from "pg";
import {
  BelongsTo, BooleanProp,
  DateProp, HasMany, Limit, NumberProp,
  setDefaultQuerier, sql,
  StringProp, Table
} from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test"
});

const querier = async (query: string, values: any[]) => {
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

  // Right now I would define a count in this way.
  // The problem is that it's not that typesafe since it's using
  // the not so typesafe `sql`function.
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

const { active } = Team.props;
const { date } = Game.props;

// compose the query
const activeTeams = Team ([
  "*",
  "playerCount",
  Game ([
    "*",
    Team (["*"]),
    date.desc (),
    Limit ("gameLimit")
  ]),
  active.eq (true)
]);

activeTeams ({ gameLimit: 1 }).then (res => {
  console.log (JSON.stringify (res[0], null, 2));
});

// {
//   "id": 1,
//   "name": "FC Wozkunos",
//   "active": true,
//   "leagueId": 1,
//   "playerCount": 11,
//   "homeGames": [
//     {
//       "id": 5,
//       "result": "2 - 3",
//       "homeTeamId": 1,
//       "awayTeamId": 6,
//       "date": "2023-12-12T23:00:00.000Z",
//       "homeTeam": {
//         "id": 1,
//         "name": "FC Wozkunos",
//         "active": true,
//         "leagueId": 1
//       },
//       "awayTeam": {
//         "id": 6,
//         "name": "FC Jewlujubu",
//         "active": true,
//         "leagueId": 1
//       }
//     }
//   ],
//   "awayGames": [
//     {
//       "id": 64,
//       "result": "5 - 0",
//       "homeTeamId": 8,
//       "awayTeamId": 1,
//       "date": "2023-05-12T22:00:00.000Z",
//       "homeTeam": {
//         "id": 8,
//         "name": "FC Copvaoha",
//         "active": true,
//         "leagueId": 1
//       },
//       "awayTeam": {
//         "id": 1,
//         "name": "FC Wozkunos",
//         "active": true,
//         "leagueId": 1
//       }
//     }
//   ]
// }