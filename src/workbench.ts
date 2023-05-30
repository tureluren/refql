import { Pool } from "pg";
import { Limit, NumberProp, setDefaultQuerier, sql, StringProp, Table, When } from ".";

const querier = async (query: string, values: any[]) => {
  console.log (`'${query}'`);
  console.log (values);
  const { rows } = await pool.query (query, values);

  return rows;
};

setDefaultQuerier (querier);


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});


const Player = Table ("player", [
  NumberProp ("id"),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  NumberProp ("teamId", "team_id").nullable (),
  NumberProp ("goalCount", sql`
    select cast (count (*) as int) from goal
    where goal.player_id = player.id
  `)
]);

const { goalCount, lastName, teamId } = Player.props;

const strikes = Player ([
  "*",
  goalCount,
  teamId.eq (1),
  goalCount.gt (7),
  lastName.like ("Craw")
]);

strikes ().then (console.log);

// [
//   {
//     id: 6,
//     firstName: "Verna",
//     lastName: "Crawford",
//     teamId: 1,
//     goalCount: 11
//   }
// ];

// searchPlayer ({ limit: 5, q: "Ba" }).then (console.log);
// [
//   { id: 11, lastName: "Bardi" },
//   { id: 14, lastName: "Barchielli" },
//   { id: 22, lastName: "Baronti" },
//   { id: 23, lastName: "Baumann" },
//   { id: 72, lastName: "Barrett" }
// ];
