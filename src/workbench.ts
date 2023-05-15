import { Pool } from "pg";
import { when } from "./common/When";
import PropType from "./RQLTag/PropType";
import sql from "./SQLTag/sql";
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

const whenie = when<{ query: string }> (p => p.query != null) (sql`and last_name = '${p => p.query}'`);

const { id, lastName, fullName, goalCount } = Player.props;

const teamie = Team (["*",
    Team.props.name.eq<{ name: string }> (p => p.name)
]);

const goals = Goal (["*"]);

const tag = Player ([
  "firstName",
  "goalCount",
  sql<{id: number }>``,
  teamie

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