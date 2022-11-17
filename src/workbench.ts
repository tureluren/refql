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

//   caseOf<Return>(structureMap: StructureMap<Return>) {
//     return structureMap.BelongsTo (this.sign);
//   }
// }

// const exp = HasMany ("-");

// const res = exp.caseOf<string> ({
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

// getPlayerById.run (querier, { id: 4 });

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

const teams = rql<{ limit: number}>`
  team { 
    * 
  }
`;


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
  const members = columns.length ? columns.map (col => Identifier (col)) : [All ("*")];
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

const filters = rql<{q: string}>`
  player {
    id
    first_name
    last_name

    ? id = '%${p => p.q}'
    & (last_name = '%${p => p.q}'
      || first_name like)
  }
 `;

const team = ``;

// const query = rql (
//   select`p.id, p.last_name, p.first_name`,
//   from`player p`,
//   where`id = ${p => p.id}`
//  ).run ();


const teamById = team<{id: number}> (
  select`
    id, last_name, first_name, age
    birthday, position_id
  `,
  filter`id = ${p => p.id}`,
  include (team)
);

const playerById = player<{id: number}> `
  select {
    id first_name last_name
  }
  where id = ${p => p.id}
`;

const playerById = player<{id: number}> (
  select (p => (["id", "first_name"])),
  where (p => ({ id: p.id }))
);

const playerByIdOld = rql`
  player (id: ${p => p.id}) {
    id
    first_name
    < goal: goals (limit: 5) {
      id
      minute
    }
  }
`;

const Player = Table ({
  goal: ["id", "player_id"]
});

const goal = Table`
  id
  minute
`;

const player = Player`
  id
  first_Ma,e
  last_name
  ${Goal`

  `}

  ${paginate}
  ${orderBy}
`;


const player2 = Player`
  id
  first_name
  last_name

  ${p => p.id}
`;

const teamQuery = Team`
  id
  name
`;

const withTeam = include (team);

// laat idfield specifieren bij Table({idField: 'id'})
const playerById = Player ({ id: p => p.id })`
  id
  first_name
  last_name
  ${Goal (p => ({ limit: p.limit }))`
    id
    minute
  `}
  ${sql ({ as: "goalCount" })`
    where id = ${p => p.id}
  `}
`;

const readPlayerById = pipe (
  player,
  byId,
  withTeam
);

const readPlayerById = Player`
  id first_name last_name
  age position_id
  ${orderByLastName}
  ${paginate}
`;

const readPlayerById = Player`
  id
  first_name
  last_name
  age
  position_id
  ${orderByLastName}
  ${paginate}
`;

const readPlayerById = Player (
  selectField,
  byId
);

// velden zijn pieces
// als 1 ding verandert kunt ge gemeenschapelijke
// fields al niemeer gebruike
const playersPage = Player`
  id
  first_name
  last_name
  position_id 
  team_id birtday

  ${orderByLastName}
  ${paginate}
`;

const playersPage = Player`
  ${orderByLastName}
  ${paginate}
`;

const readPlayersPage = (limit, offset) =>
  playersPage.run ({ limit, offset });

// concat wel mogelijk
Player`id`.concat (Player`first_name last_name`);

Player`
  id
  name
  ${Goal},
  ${Team}
`;

// implie *
Player`
  ${Goal},
  ${Team}
`;

Player`
  id
  firstName
  ${Player`last_name`} ->> merge
  ${Goal},
  ${Team}
`;

Player`
  id
  first_name
  goals -> resolve in Table ({ goals: { }})
  team
`;

// laat dan in resolver team ophalen advh sql tag defined by user zelf
// aggregate by user
Table ({
  goals: sql`
    selecte from goal
    where player_id = ${p => p.user.id} 
  `
});

const BasePlayer = Player`
  id
  first_name
  last_name
`;

const PlayerById = BasePlayer.concat (Player`
  where id = ${p => p.id}
`);

const PlayerById = Player`
  ${BasePlayer}
  where id = ${p => p.id}
`;

// player and game both have goals
const hasManyGoals = name => HasMany (Goal, {
  as: "goals",
  lRef: "id",
  rRef: `${name}_id`
});

const belongsToToManyGames = (name, _schema) => ManyToMany (Game, {
  as: "games", xTable: `${name}_game`,
  lRef: "id", lxRef: `${name}_id`,
  rRef: "id", rxRef: "game_id"
});

const Player = Table ("public.player", [
  name => HasMany (Goal, {
    as: "goals",
    lrefs: ["id"],
    rrefs: [`${name}_id`]
  }),
  () => BelongsTo (Team, {
    as: "team",
    lrefs: ["team_id"],
    rrefs: [`id`]
  })
]);

const Player = Table ("public.player", () => [
  HasMany (Goal, {
    as: "goals",
    lrefs: ["player_id"],
    rrefs: ["id"]
  })
]);

const Player = Table ("public.player", [
  name => HasMany (Goal, {
    as: "goals",
    lRef: "id",
    rRef: `${name}_id`
  })
]);

const Player = Table ("public.player", [
  () => HasMany (Goal, { as: "goals" }),
  () => BelongsTo (Team)
]);


const Player = Table ("public.player", [
  hasManyGoals,
  belongsToTeam
]);


const Player = Table ("public.player", () => [
  HasMany ({
    table: Goal,
    as: "goals",
    lrefs: ["player_id"],
    rrefs: ["id"]
  })
]);

Player`
  ${Goal} // include elke ref naar Goal
`;

Player`
  ${Goal}:goals // enkel goals
`;

// belongsToMany ipv manyToMany
// hasOne

const Player = Table ("public.player", () => [
  () => HasMany (Goal, "goals", "player_id", "id")
]);


const select = Table => Table`*`;