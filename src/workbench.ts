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
  console.log (values);
  // const { rows } = await pool.query (query, values);

  // return rows;
  return [];
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
  NumberProp ("playerCount", sql<{ buh: number}>`
    select cast(count(*) as int) from player
    where player.team_id = team.id
    and 1 = ${p => p.buh}
  `),

  NumberProp ("playerCount2", sql`
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

const playerCount2 = NumberProp ("playerCount", sql`
  select cast(count(*) as int) from player
  where player.team_id = team.id
`);
// const playerCount = NumberProp ("playerCount", sql`
//   select cast(count(*) as int) from player
//   where player.team_id = team.id
// `);

const { id, name, playerCount } = Team.props;

const innie = id.in<{ ids: number[]}> (p => p.ids).omit ();
const teamById = Team ([
  "name",
  "active",
  playerCount,
  playerCount2,
  innie
  // playerCount2.eq (11),
  // name.desc (),
  // Game (["result"]),
  // sql`limit 1`
  // OrderBy()
]);

teamById ({ ids: [1, 2], buh: 1 }, querier).then (ts => console.log (ts));

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

// OrderBy rqlNode OrderBy(p => p.ordery) (kan ook gewoon een SQL worden he) (maar dan maakt volgorde wel uit)
// const OrderBy = sql`
// ->   {Raw(p => order by `p.orderBy`)}
// -> ` write in docs en tests miss ?

// omitted prop moet uit type gaan


// paginated = allPlayers.concat([Limit, Offset])


// know Issues, pred return false () => extra " " in queries

// employee ipv soccer

const insertTeam = Team.insert ([
  // "name"
  name,
  "active"
  // name.nullable (),
  // returning (insertedTeams) // inserted teams = rqlTag of gewoon comps ?
]);

insertTeam ([{ active: true, name: "dd" }, { active: true, name: "dd" }]).then (res => console.log (res));

// const updateTeam = Team.update ([
//   "buh",
//   name.nullable (),
//   id.eq(1),
//   returning (insertedTeams) // inserted teams = rqlTag of gewoon comps ?
// ]);

// const updateTeam = Team.delete ([
//   id.eq(1),
//   returning (insertedTeams) // inserted teams = rqlTag of gewoon comps ?
// ]);