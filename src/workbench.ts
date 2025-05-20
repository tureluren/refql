import { Pool } from "pg";
import RefQL, {
  BelongsTo, BooleanProp,
  DateProp, HasMany, Limit, NumberProp,
  Offset,
  Prop,
  Raw,
  StringProp,
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

class Task<Output> {
  fork: (rej: (e: any) => void, res: (x: Output) => void) => void;

  constructor(fork: (rej: (e: any) => void, res: (x: Output) => void) => void) {
    this.fork = fork;
  }
}

// natural transformation
const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  console.log (values);
  const res = await pool.query (query, values);

  // return rows;
  return res.rows;
};

const promiseToTask = <Output>(p: Promise<Output>) =>
  new Task<Output> ((rej, res) => p.then (res).catch (rej));

const { tables, sql, Table } = RefQL ({
  querier,
  runner: tag => promiseToTask (tag.run ({}))
  // runner: promiseToTask
});


const { Player, Game, Team } = tables.public;


const { id: playerId, birthday } = Player.props;

const buh = playerId.eq (1);


const isVeteran = BooleanProp ("isVeteran", sql<{ year: number }>`
  select case when extract(year from birthday) < ${p => p.year} then true else false end
  from player
  where id = player.id
  limit 1
`);

const playerById = Player ([
  playerId.eq (1),
  // "isVeteran"
  // isVeteran.eq (true)
  // "birthday",
  // birthday,
  // playerId.omit (),
  // playerId.omit ()
  // isVeteran
  // Team (["active"]),
  // Goal (["id"])
  // Team,
  // Goal,
  Game (["awayTeamId"])
]);

playerById ({ year: 2002 }).then (p => console.log (p));

// const Team = Table ("public.team", [
//   NumberProp ("id").hasDefault (),
//   StringProp ("name"),
//   BooleanProp ("active").hasDefault (),
//   NumberProp ("leagueId", "league_id").nullable (),

//   // A game will usually have two refs to a team table
//   // which means u're gonna end up with two arrays (homeTeams and awayTeams)
//   // U will have to determine which array contains the last game after the result
//   // comes back from the db.
//   HasMany ("homeGames", "game", { rRef: "home_team_id" }),
//   HasMany ("awayGames", "game", { rRef: "away_team_id" })

// ]);

// // Right now I would define a count in this way.
// // The problem is that it's not that typesafe since it's using
// // the not so typesafe `sql`function.
const playerCount = NumberProp ("playerCount", sql`
    select cast(count(*) as int) from player
    where player.team_id = team.id
  `);

const playerCount2 = NumberProp ("playerCount2", sql<{buh: string}>`
    select cast(count(*) as int) from player
    where player.team_id = team.id
  `);

// const Position = Table ("position", []);

// const Game = Table ("game", [
//   NumberProp ("id"),
//   StringProp ("result"),
//   NumberProp ("homeTeamId", "home_team_id"),
//   NumberProp ("awayTeamId", "away_team_id"),
//   BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
//   BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
//   DateProp ("date")
// ]);


// const playerCount = NumberProp ("playerCount", sql`
//   select cast(count(*) as int) from player
//   where player.team_id = team.id
// `);

const { id, name, active } = Team.props;
const { result } = Game.props;

// const innie = id.in<{ ids: number[]}> (p => p.ids).omit ();
const eqed = id.eq (2);
const eqedSql = sql`
    and id = {2}
  `;

const teamById = Team ([
  // "name",
  // "active",
  // playerCount.eq (11),
  // innie,
  // sql`
  //   and id = {2}
  // `,
  // sql<{id: number}>`
  //   and id = {2}
  // `,
  // NumberProp ("playerCount2", sql<{buh: string}>`
  //   select cast(count(*) as int) from player
  //   where player.team_id = team.id
  // `)
  // eqedSql
  id.eq (p => 2),
  // id.eq<{id: number}> (p => 2)
  // id.eq<{id2: number}> (p => 2)
  // eqed,
  // id,
  // playerCount,
  // playerCount2.eq (11),
  // name.desc (),
  Game (["result"])
  // sql`limit 1`
  // OrderBy()
]);
// .concat (Team (["name", Game (["date"])]));

// teamById ().then (ts => console.log (ts[0]));

// const getTeams = Team ([Game, Limit (1)]);
// getTeams ().then (e => console.log (e));

// const teamById = sql`
//   select id, name, ${Raw ("active")} from team
//   where id = ${p => p.id}
//   or id = ${2}
//   or id in ${Values ([3, 4, 5])}
// `;

// teamById ({ id: 1 }).then (console.log);


// REMOVE all -> *
// afstappen van querier
// count enzo toevoegen om subselects zonder sqlTag te doen
// insert, update
// register subselect to Player ?
// employee model

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
// belongsto many kan volgens mij gwn gededecteerd worden
// aggregation, grouping
// refprops zitten ook op props, dit ook laten toevoegen aan query ?
// const { id, name, playerCount, active, homeGames } = Team.props;
// monoid weghalen uit spec
// regels many_to_many opstellen
// configuratie
// tx

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
    // Team(["active"]),
    byIds,
    Limit<{ limit: number}> (p => p.limit)
  ])
  // Game (["*"])
]);

// insertTeam ({ data: [{ name: "iep", leagueId: 4 }], limit: 2 })
//   .then (r => console.log (r[0]))
//   .catch (console.log);

// .then (res => console.log (res));

const updateTeam = Team.update ([
  id.eq<{ id: number }> (p => p.id),
  Team (["active", Team.props.id.in<{ rows: { id: number }[]}> (p => p.rows.map (r => r.id))])
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


// const justSql = sql`
//   ${sql<{id: number}>`
//       idd
//   `}
//   ${sql<{id2: number}>`
//       idd
//   `}
// `;

// justSql ().then (r => console.log (r));