// @ts-nocheck
import { Pool } from "pg";
import mySql from "mysql2";
import In from "./In";
import { rql } from "./index";
import { All, BelongsTo, Call, HasMany, Identifier, Keywords, ManyToMany, Root, StringLiteral, Variable } from "./nodes";
import Raw from "./Raw";
import RQLTag from "./RQLTag";
import { Goal, Player } from "./soccer";
import SQLTag from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import { StringMap, Querier } from "./common/types";
import TableNode from "./nodes/TableNode";

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


const orderBy = sql<{ col: string; dir?: string }>`
  order by ${p => Raw (p.col)} ${p => Raw (p.dir || "asc")}
`;

const paginate = sql<{limit: number; offset: number}>`
  limit ${p => p.limit}
  offset ${p => p.offset}
`;

const getPlayers =
  player.concat (orderBy).concat (paginate);


// NT
const rootToBelongsTo = <Params>(node: TableNode<Params>) => {
  return BelongsTo (node.table, node.members, node.keywords);
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
`.map (node => {
  node.keywords = { lref: "dd" };
  return node;
});

// natural transformation
const rootToHasMany = <Params>(node: TableNode<Params>) => {
  return HasMany (node.table, node.members, node.keywords);
};


const hasMany = <Params> (tag: RQLTag<Params>) => <Params2>(tag2: RQLTag<Params2>) => {
  return tag2.map (node => node.addMember (rootToHasMany (tag.node)));
};


const select = (table: Table, columns: string[] = []) => {
  const members = columns.length ? columns.map (col => Identifier (col)) : [all];
  return rql<{}>`${table} ${members}`;
};

const byIdTag = sql<{id: number}>`
  where ${(_p, t) => t}.id = ${p => p.id}
`;


// where (byId) (select ("player", [])).run<Player> (querier, { id: 5 }).then (console.log);
// const getTeams = pipe (
//   teams,
//   belongsTo (leagues)
// );

const updateKeywords = <Params>(keywords: Keywords<Params>) => (tag: RQLTag<Params>) => {
  return tag.map (node => {
    const newKeywords = { ...node.keywords, ...keywords };
    return Object.assign (node, { keywords: newKeywords });
  });
};

const playerGoalsRefs = { lref: "id" };

// const getGoals = pipe (
//   goals,
//   updateKeywords (playerGoalsRefs)
// );

// const getPlayer = pipe (
//   players,
//   belongsTo (getTeams),
//   hasMany (getGoals)
// );


// run (getPlayer, { id: 9, goalLimit: 4 }).then (console.log);

// MY SQL QUERIER na uitleg postgresQuerier


const tag = sql<{id: number}>`
  where id = ${p => p.id}
`;

const varTag = Variable (tag);

const rqlTag = rql`
  player {
    *
  }
`.map (node => {
  const newNode = node.addMember (Variable (tag));
  return newNode;
});

rqlTag.run (querier, { id: 4 });


const teamQuery = rql`
  team {
    *
  }
`;

const goalQuery = rql`
  goal {
    *
  }
`;

const getPlayer = rql<{ id: number }>`
  ${Table ("player")} {
    *
    - ${teamQuery}
    < ${goalQuery}:goals
    ${(p, t) => sql`
      where ${t}.id = ${p.id} 
    `}
  }
`;


getPlayer.run<Player> (querier, { id: 9 }).then (console.log);


// const belongsTo = <Params>(tag: RQLTag<Params>) => <Params2>(node: Root<Params2>) => {
//   return node.addMember (tag.node.toBelongsTo ());
// };

// const hasMany2 = <Params>(tag: RQLTag<Params>, as: string) => <Params2>(node: Root<Params2>) => {
//   return node.addMember (tag.node.toHasMany (as));
// };

// const insert = sql`
//   insert into user ${Insert (["a", "b"], [])}
// `;

// const insert2 = sql`
//   ${Insert ("user", ["a", "b"], [])}
// `;

// const update = sql`
//   update user set ${Update (["a", "b"], {})}
//   where id = 1
// `;

// const update2 = sql`
//   ${Update ("user", ["a", "b"], {})}
//   where id = 1
// `;

/**
 * Insert type (table of string, col arr array of 1 obj)
 * lower insert function die compile doet
 * update type
 * Select type
 * delete
 *  case of ??
 *
 * ditch in en maak array type ? of ditch enkel keyword
 *
 * from table, is da wel een goe idee ?
 * export
 * Select
 * table compile ipv write
 * rekening houden met table schema
 *
 * sig compile (options, idx)
 *
 * handle * en columns to insert af in helpers en table alsook kijken of object of array bij insert
 *
 * TABLE("public.user as 'user'"")
 */

// filters

// const teamById = team<{id: number}> (
//   select`
//     id, last_name, first_name, age
//     birthday, position_id
//   `,
//   filter`id = ${p => p.id}`,
//   include (team)
// );



// concat wel mogelijk
Player`id`.concat (Player`first_name last_name`);


// const BasePlayer = Player`
//   id
//   first_name
//   last_name
// `;

// const PlayerById = BasePlayer.concat (Player`
//   where id = ${p => p.id}
// `);

// const PlayerById = Player`
//   ${BasePlayer}
//   where id = ${p => p.id}
// `;

// player and game both have goals




// belongsToMany ipv manyToMany
// hasOne


// const select = Table => Table`*`;