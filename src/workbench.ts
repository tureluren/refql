import { Pool } from "pg";
import RefQL, { Limit, NumberProp, Offset, StringProp } from ".";

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

const readStrikers = Player ([
  goalCount.gt (7),
  teamId
    .eq (1)
    // "teamId" column will not be in the result
    .omit ()

]);

const searchStrikers = Player ([
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
readStrikersPage ({ q: "Gra%" }).then (console.log);

// [