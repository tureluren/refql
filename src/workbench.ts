import { Pool } from "pg";
import mySql from "mysql2";
import { pipe } from "fp-ts/function";
import In from "./In";
import { rql } from "./index";
import { All, BelongsTo, Call, HasMany, Identifier, ManyToMany, Root, StringLiteral, Variable } from "./Parser/nodes";
import Raw from "./Raw";
import RQLTag from "./RQLTag";
import { Goal, Player } from "./soccer";
import SQLTag from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import { StringMap, Keywords, TableNode, Querier } from "./types";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

// const mySqlPool = mySql.createPool ({
//   user: "test",
//   host: "localhost",
//   database: "soccer",
//   password: "test",
//   port: 5432,
//   multipleStatements: true
// });

const querier = <T>(query: string, values: any[]) => {
  console.log (query);
  console.log (values);
  return pool.query (query, values).then (({ rows }) => rows as T[]);
};

// const mySQLQuerier = <T>(query: string, values: any[]): Promise<T[]> =>
//   new Promise ((res, rej) => {
//     const qry = query.replace (/\$\d/g, "?");
//     console.log (qry);
//     mySqlPool.query (qry, values, (error, rows) => {
//       if (error) {
//         rej (error);
//         return;
//       }
//       res (rows as T[]);
//     });
//   });

const makeRun = <Output>(querier: Querier<Output>) => <Params>(tag: RQLTag<Params> | SQLTag<Params>, params: Params) => {
  return tag.run (querier, params);
};

const run = makeRun<Player> (querier);





// const hasMany2 = <Params> (tag: RQLTag<Params>) => <Params2>(tag2: RQLTag<Params2>): RQLTag<Params & Params2> => {
//   return tag2.concat (tag.map (node => {
//     if (!(
//       node instanceof Root ||
//       node instanceof HasMany ||
//       node instanceof BelongsTo ||
//       node instanceof ManyToMany
//     )) {
//       // or throw error
//       return node;
//     }
//     return toHasMany (node);
//   }));
// };

const playerQuery = rql<{ id: number; limit: number }>`
  ${Table ("player")} (limit: 5) {
    id
    - ${rql`
      team { * }
    `}
    last_name
    ${() => sql`
      where id = ${10} 
    `}
  }
`;


// const upd = playerQuery.map (node => updateKeywords<{off: number}> ({
//   offset: p => p.off
// }) (node));

// console.log (upd);

// const goalsQuery = rql<{ limit: number }>`
//   goals (limit: 1) {
//     id
//     minute
//   }
// `;

const playerGoalsRef = {
  lkey: "id",
  rkey: "goal_id"
};

// const hasManyGoals = hasMany (goalsQuery.map (updateKeywords (playerGoalsRef)));
// const hasManyGoals2 = hasMany2 (goalsQuery.map (updateKeywords (playerGoalsRef)));

// const query = playerQuery.concat (goalsQuery.map (toHasMany));
// const query = playerQuery
//   .concat (hasManyGoals);

// const query2 = hasManyGoals2 (playerQuery);


// run (playerQuery, { id: 1, limit: 5 })
//   .then (rows => console.log (rows[1]));

// playerQuery.run<Player> (querier, { id: 1, limit: 5 }).then (players => {
//   console.log (players);
// });




const selectPlayer = sql<{id: number}>`
  select * from player
`;

const buh = selectPlayer;
// console.log (selectPlayer);
// console.log (buh);

// const paginate = sql<{}, any>`
//   limit 5
//   offset 0
// `;

// const paginate = <Params>(tag: RQLTag<Params> | SQLTag<Params>) =>
//   tag.concat (sql<Params & { limit: number}>`
//     limit ${(params: any) => params.limit}
//     offset 0
//   `);




// compose (orderByName, paginate) (selectPlayer)

// const fullPlayer = paginate (selectPlayer);


// run<{limit: number; id: number}, Player> (fullPlayer, { limit: 5, id: 5 }).then (players => {
//   console.log (players);
// });



// class BelongsTo {
//   sign: string;

//   constructor(sign: string) {
//     this.sign = sign;
//   }

//   cata<Return>(pattern: Pattern<Return>) {
//     return pattern.BelongsTo (this.sign);
//   }
// }

// const exp = HasMany ("-");

// const res = exp.cata<string> ({
//   BelongsTo: x => x,
//   HasMany: x => x
// });


// const playerAst = rql<{ id: number}>`
//   player (id:1) {
//     last_name
//   }
// `;

// const teamAst = rql<{ limit: number }>`
//   team {
//     *
//   }
// `;

// const RootToBelongsTo = <Params> (node: Root<Params>) =>
//   BelongsTo (node.table, node.members, node.keywords);

// const belongsTo = <Params>(tag: RQLTag<Params>) => <Params2>(tag2: RQLTag<Params2>) => {
//   return tag2.map (node => {
//     return node.addMember (RootToBelongsTo (tag.node));
//   });

// };

// console.log (res);
// const res = belongsTo (teamAst) (playerAst);

// const res = playerAst.map (node => {
//   return node.addMember (toBelongsTo (teamAst.node));
// });

// teamAst.node = BelongsTo (Table ("team"), [], {});


// res.run<Player> ({ caseType: "snake" }, querier, { id: 3, limit: 4 }).then (console.log).catch (e => {
//   console.log (e.message);
// });

// db- functions

// REMOVE FPTS

// enkel bij sql tag gebruiken


const player = sql`
  select id, first_name, last_name
  from player
`;

const byId = sql<{id: number}>`
  where id = ${p => p.id}
`;

const getPlayerById =
  player.concat (byId);

// getPlayerById.run (querier, { id: 1 }).then (console.log);

// semigroup bewijs

const orderBy = sql<{ col: string; dir?: string }>`
  order by ${p => Raw (p.col)} ${p => Raw (p.dir || "asc")}
`;

const paginate = sql<{limit: number; offset: number}>`
  limit ${p => p.limit}
  offset ${p => p.offset}
`;

const getPlayers =
  player.concat (orderBy).concat (paginate);

// different approach met pipe

// run (getPlayers, { col: "last_name", limit: 5, offset: 0, dir: "desc" }).then (console.log);

//INTRODUCE RQL

// same example
const playerById = rql<{ id: number }>`
  player (id: ${p => p.id}) { 
    id
    first_name
    last_name 
  }
`;

// players.run (querier, { id: 4 });

const teams = rql<{}>`
  team { 
    * 
  }
`;


// NT
const rootToBelongsTo = <Params> (node: TableNode<Params>) => {
  return BelongsTo<Params> (node.table, node.members, node.keywords);
};

// NOT A SEMIGROUP, because semigroup laws don't goe
// but it is a functor thout, so you can use map to compose stuff
const getPlayerById2 =
  playerById.map (node => node.addMember (rootToBelongsTo (teams.node)));

// ALT, graphqlish - indicating a that a player belongs to a team, less reusable though
const playerByIdAlt = rql<{ id: number }>`
  player (id: ${p => p.id}) { 
    id
    first_name
    last_name 
    - team {
      *
    }
  }
`;

// playersAlt with dyamic table and belongsto


const players = rql<{ id: number }>`
  player (id: ${p => p.id}) { 
    *
  }
`;
const leagues = rql<{}>`
  league { * }
`;

const goals = rql<{goalLimit?: number}>`
  goal (limit: ${p => p.goalLimit}) { * }
`;

// natural transformation
const rootToHasMany = <Params> (node: TableNode<Params>) => {
  return HasMany (node.table, node.members, node.keywords);
};

const belongsTo = <Params> (tag: RQLTag<Params>) => <Params2>(tag2: RQLTag<Params2>) => {
  return tag2.map (node => node.addMember (rootToBelongsTo (tag.node)));
};

const hasMany = <Params> (tag: RQLTag<Params>) => <Params2>(tag2: RQLTag<Params2>) => {
  return tag2.map (node => node.addMember (rootToHasMany (tag.node)));
};


const select = (table: Table, columns: string[] = []) => {
  const members = columns.length ? columns.map (col => Identifier (col)) : [All ("*")];
  return rql<{}>`${table} ${members}`;
};

const byIdTag = sql<{id: number}>`
  where ${(_p, t) => t}.id = ${p => p.id}
`;


// where (byId) (select ("player", [])).run<Player> (querier, { id: 5 }).then (console.log);
const getTeams = pipe (
  teams,
  belongsTo (leagues)
);

const updateKeywords = <Params>(keywords: Keywords<Params>) => (tag: RQLTag<Params>) => {
  return tag.map (node => {
    const newKeywords = { ...node.keywords, ...keywords };
    return Object.assign (node, { keywords: newKeywords });
  });
};

const playerGoalsRefs = { lref: "id" };

const getGoals = pipe (
  goals,
  updateKeywords (playerGoalsRefs)
);

const getPlayer = pipe (
  players,
  belongsTo (getTeams),
  hasMany (getGoals)
);


// run (getPlayer, { id: 9, goalLimit: 4 }).then (console.log);

// MY SQL QUERIER na uitleg postgresQuerier
