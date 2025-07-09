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




const { teamId, firstName, lastName } = Player.props;

const readPart1 = Player ([
  "id",
  "firstName",
  Team (["id"])
]);

const readPart2 = Player ([
  "lastName",
  Team (["name"]),
  Limit<{ limit: number }> (p => p.limit),
  Offset<{ offset: number }> (p => p.offset)
]);

const readPage =
  readPart1
    .concat (readPart2);

readPage ({ limit: 5, offset: 0 }).then (res => console.log (res[0]));

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
