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
  console.log ("'" + query + "'");
  console.log (values);
  const res = await pool.query (query, values);

  // return rows;
  return res.rows;
};

setDefaultQuerier (querier);

const Team = Table ("public.team", [
  NumberProp ("id").hasDefault (),
  StringProp ("name"),
  BooleanProp ("active").hasDefault (),
  NumberProp ("leagueId", "league_id").nullable (),

  // A game will usually have two refs to a team table
  // which means u're gonna end up with two arrays (homeTeams and awayTeams)
  // U will have to determine which array contains the last game after the result
  // comes back from the db.
  HasMany ("homeGames", "game", { rRef: "home_team_id" }),
  HasMany ("awayGames", "game", { rRef: "away_team_id" })

]);

// // Right now I would define a count in this way.
// // The problem is that it's not that typesafe since it's using
// // the not so typesafe `sql`function.
const playerCount = NumberProp ("playerCount", sql`
    select cast(count(*) as int) from player
    where player.team_id = team.id
  `);

const playerCount2 = NumberProp ("playerCount2", sql`
    select cast(count(*) as int) from player
    where player.team_id = team.id
  `);

const Position = Table ("position", []);

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

const { id, name, active } = Team.props;

const innie = id.in<{ ids: number[]}> (p => p.ids).omit ();

const teamById = Team ([
  "name",
  "active",
  playerCount.eq (11),
  innie,
  //  Team (["*"])
  // playerCount2.eq (11),
  // name.desc (),
  Game (["result"])
  // sql`limit 1`
  // OrderBy()
]).concat (Team (["name", Game (["date"])]));

// teamById ({ ids: [1, 2] }, querier).then (ts => console.log (ts[0]));

const getTeams = Team ([Game, Limit (1)]);
getTeams ().then (e => console.log (e));

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


// paginated = allPlayers.concat([Limit, Offset])


// know Issues:
// - in delete no option to define returning RQLTag cause i don't see the point
// - in returning rql tag (inserts, updates) params is any to no type info about returns, so we need
//    const byIds = sql<{ id: number}[]>`
//      and id in ${Values (rows => rows.map (r => r.id))}
//     `;

// TODO:
// sqltag types MOGEN NIET IN RETURN TYPE ZITTEN bij CUD
// aggregation, grouping
// refprops zitten ook op props, dit ook laten toevoegen aan query ?
// const { id, name, playerCount, active, homeGames } = Team.props;

// DECISIONS
// inc ipv omit, omdat bij update statements, byId, meestal wilt ge dan geen set id ={}, enkel op filteren en bij gewone selects kunt ge met * werken ipv incl()

// employee ipv soccer
const byIds = sql<{rows: { id: number}[]}>`
  and id in ${Values (({ rows }) => rows.map (r => r.id))} 
`;

const insertTeam = Team.insert ([
  // "name",
  // // name,
  // "active",
  // name.nullable ()
  Team (["name", "leagueId"]),
  Team ([
    playerCount,
    "id",
    "active",
    Game,
    byIds,
    Limit<{ limit: number}> (p => p.limit)
  ])
  // Game (["*"])
]);

// insertTeam ({ data: [{ name: "iep", leagueId: 4 }], limit: 2 })
//   .then (r => console.log (r))
//   .catch (console.log);

// .then (res => console.log (res));

const updateTeam = Team.update ([
  id.eq<{ id: number }> (p => p.id)
]);

// updateTeam ({ data: { name: "foemp", active: false }, id: 2 })
//   .then (r => console.log (r))
//   .catch (console.log);

// const updateTeam = Team.delete ([
//   id.eq(p => p.id),
//   returning (insertedTeams) // inserted teams = rqlTag of gewoon comps ?
// ]);


// upsert ??

// const tag = Team ([
//   name.isNull<{ isNull: boolean }> ((p => p.isNull))
// ]);

// tag ({ isNull: false }).then (() => null);

const deleteTeam = Team.delete ([
  id.eq<{ id: number }> (p => p.id)
]);

// deleteTeam ({ id: 2000 })
//   .then (r => console.log (r))
//   .catch (console.log);

// maak distinct mogelijk
// const findCity = sql`
//   select distinct city, zip
//   from organisation.location
//   where city ilike ${p => `%${p.q}%`}
//   or zip ilike ${p => `%${p.q}%`}
//   order by city, zip
//   limit 50
// `;