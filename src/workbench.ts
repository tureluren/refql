import { Pool } from "pg";
import When from "./common/When";
import Eq from "./RQLTag/Eq";
import { isSQLTag } from "./SQLTag";
import sql from "./SQLTag/sql";
import numberProp from "./Table/numberProp";
import { Goal, League, Player, Team } from "./test/tables";


const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = async (query: string, values: any[]) => {
  console.log (query);
  const { rows } = await pool.query (query, values);

  return rows;
};


const { id, lastName, fullName, goalCount } = Player.props;

const teamie = Team (["*",
    Team.props.name.eq (p => p.name)
]);

const goals = Goal (["*"]);

const whenie = When (p => p.query != null, sql`and last_name = '${p => p.query}'`);

const tag = Player ([
  "firstName",
  numberProp ("goalCount", sql`
    select count (*)::int from goal
    where goal.player_id = player.id
  `),
  "fullName",
  sql``,
  // teamie,
  Goal (["*"]),
  When (p => p.query != null, sql<{ query: string }>`and last_name = '${p => p.query}'`)
  // whenie

  // teamie
]);


// eq ("id");
tag ({ id: 2, name: "any" }, querier).then (res => console.log (res[0]));

// const simpleTag = sql<{firstNameField: string}, { id: number; first_name: string}[]>`
//   select id, ${Raw (p => p.firstNameField)}
// `;

// const simpleTag2 = sql<{limit: number}, { last_name: string}[]>`
//   , last_name
//   from player
//   limit ${p => p.limit}
// `;

// const combined = simpleTag.concat (simpleTag2);


// // combined.co




// combined ({ firstNameField: "first_name", limit: 2 }, querier).fork (console.log, console.log);

// const tag1 = sql`
//   select * from player
// `;

// const tag2 = sql<{ id: number }>`
//   where id = 1
// `;

// const tag3 = tag1.concat (tag2);

// tag3 ({ id: 1 }, querier).then (res => console.log (res));


const tag11 = sql<{}, { name: string }[]>`
  select id, name
`;

const tag12 = sql<{}, { id: number }[]>`
  select id, name
`;

const tag13 = tag11.concat (tag12);

if (isSQLTag (tag11)) {
  const buhh = tag11;
}

const Eqie = Eq ("string", (p: { id: number }) => p.id);