import { Pool } from "pg";
import RefQL, { isRQLTag, Limit, NumberProp, Offset, Raw, RQLTag, SQLTag, StringProp, Values } from ".";
import { Selectable } from "./common/types";

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

const { Team, Player, Goal } = tables.public;

const TestTable = Table ("dd", [StringProp ("buhbuh")]);

TestTable ([
]);


const { teamId, firstName, lastName, id } = Player.props;

const insert = Player.insert ([
  Player (["firstName"]),
  Player (["lastName"])
]);

// insert ({ data: [{ firstName: "foemp", lastName: "ddd", cars: {} }] }).then (res => res[0]);

const update = Player.update ([
  id.eq<{ id: number}> (p => p.id),
  Player ([
    "birthday",
    Team (["active"])
  ])
]);

update ({ data: { firstName: "foemp", lastName: "ddd", cars: {} }, id: 2 }).then (res => res[0]);

const deletes = Player.delete ([
  id.eq<{ id: number}> (p => p.id)
]);

deletes ({ id: 2 }).then (res => res[0]);


// + laat logic werken met sqlTag
// this gebruiken
// concat 2 van zelfde ref
// monoid ? en sql tag ook ?
// check for unused types and remove
// generated terug nakijken
// readme wijzigen

// const noSecrets = User ([
//   password.omit (),
//   secrets2fa.omit ()
// ]);
// export const readUserPage = noSecrets.concat (User ([
//   Caregiver,
//   updatedAt.desc (),
//   id.desc (),
//   Limit (p => p.limit),
//   Offset (p => p.limit * p.page)
// ]));

const justTeam = Team (["id", "name", "name"]) ({}).then (t => t[0]);

const ta = Team (["active"]);
const readPart1 = Player ([
  "birthday",
  Team (["id"]),
  Goal (["gameId"])

  // Team.props.active
  // ta
]);

const Buh: SQLTag<{ id: string }> | RQLTag<"Player"> = "d" as any;

if (isRQLTag (Buh)) {
  const buh = Buh;
}

// const comps = readPart1["components"][0]["components"];


readPart1 ({}).then (res => res[0]);

const readPart2 = Player ([
  // "lastName",
  Team (["name"])
  // Limit<{ limit: number }> (p => p.limit),
  // Offset<{ offset: number }> (p => p.offset)
]);


const readPage =
  readPart1
    .concat (readPart2);

readPage ({ limit: 5, offset: 0 }).then (res => res[0]);

// [
const byIds = sql<{rows: { id: number }[]}>`
  and id in ${Values (({ rows }) => rows.map (r => r.id))} 
`;

const insertTeam = Team.insert ([
  Team ([
    "id",
    "name",
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

const fullName = StringProp ("fullName", sql<{ delimiter: string }>`
    concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
  `);


const PatchedPlayer = Player.addProps ([fullName]);
const { fullName: fullNameP } = PatchedPlayer.props;

const andd = PatchedPlayer ([
  // firstName.gt ("a").lt ("z").and (firstName.eq ("dd").or (firstName.lt ("z"))),
  // fullNameP
  // "*",
  "fullName",
  Limit (1)
]);

// andd ({ delimiter: " " }).then (res => console.log (res[0]));