import { Pool } from "pg";
import {
  BelongsTo, Limit, NumberProp, Offset, Raw, SelectableType, setDefaultQuerier, sql, StringProp, Table, When
} from ".";
import { Player, Team } from "./test/tables";

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

const { id, lastName, firstName, fullName, goalCount, isVeteran } = Player.props;

// select components
// const tag = Player ([
//   id,
//   When (p => !!p.id, [
//     id.eq<{ id: number }> (p => p.id)
//   ]),
//   When (p => true, [
//     lastName.asc (),
//     When (p => !!p.limit, [
//       Limit (),
//       When (p => !!p.offset, [
//         Offset ()
//       ])
//     ])
//   ]),
//   When (p => true, [
//     lastName.asc ()
//   ])
// ]);


// and run
// tag ({ id: 1 }).then (x => console.log (x));

const tag = Player ([
  id,
  lastName,
  id.in ([1, 2, 3]).not ()
]);

tag ({ year: 1970 }).then (console.log);
