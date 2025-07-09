import { Pool } from "pg";
import RefQL, { Limit, NumberProp, Offset, StringProp, Values } from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});


const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  // console.log (values);
  const res = await pool.query (query, values);

  return res.rows;
};


const { tables, Table, sql } = RefQL ({
  querier
});

const { Team, Player } = tables.public;




const { teamId, lastName } = Player.props;

const goalCount = NumberProp ("goalCount", sql`
  select cast(count(*) as int) from goal
  where goal.player_id = player.id
`);

const buh = teamId;

// "teamId" column will not be in the result
// .omit ();
const readStrikers = Player ([
  goalCount.gt (7),
  Player.props.id
]);

const searchStrikers = Player ([
  // Player.props.id,
  lastName
    .iLike<{ q: string }> (p => p.q)
    // order by lastName asc
    .asc ()
]);

const readPlayerPage = Player ([
  Limit (5),
  Offset (0)
]);

const readStrikersPage =
  readStrikers
    .concat (searchStrikers)
    .concat (readPlayerPage);

// run
readStrikersPage ({ q: "Gra%" }).then (res => console.log (res[0]));

// [
const byIds = sql<{rows: { id: number }[]}>`
  and id in ${Values (({ rows }) => rows.map (r => r.id))} 
`;

const insertTeam = Team.insert ([
  Team ([
    "id",
    "name",
    Player,
    byIds
  ])

  // Team ([
  //   "active",
  //   "leagueId"
  // ])
]);

// Fields that are not nullable and don't have a default value are required
// insertTeam ({ data: [{ name: "New Team", leagueId: 1 }] })
//   .then (console.log);
