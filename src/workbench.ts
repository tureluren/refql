import { Pool } from "pg";
import In from "./In";
import { rql } from "./index";
import { BelongsTo, Call, HasMany, Identifier, ManyToMany, Root, StringLiteral } from "./Parser/nodes";
import Raw from "./Raw";
import RqlTag from "./RqlTag";
import { Goal, Player } from "./soccer";
import SqlTag from "./SqlTag";
import sql from "./SqlTag/sql";
import Table from "./Table";
import { AstNode, Config, Dict, CaseType, Keywords, TableNode, Querier } from "./types";

// RENAME record to rec

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = <T>(query: string, values: any[]) =>
  pool.query<T> (query, values).then (({ rows }) => rows);

const config: Config = {
  caseType: "snake"
};

const makeRun = <Output>(config: Config, querier: Querier<Output>) => <Params>(tag: RqlTag<Params> | SqlTag<Params>, params: Params) => {
  return tag instanceof RqlTag
    ? tag.run (config, querier, params)
    : tag.run (querier, params);
};

const run = makeRun<Player> (config, querier);

const updateKeywords = <Params>(keywords: Keywords<Params>) => (node: TableNode<Params>): TableNode<Params> => {
  const newKeywords = { ...node.keywords, ...keywords };
  return {
    ...node,
    keywords: newKeywords
  } as typeof node;
};


// const toHasMany = <Params> (node: TableNode<Params>): HasMany<Params> => {
//   return HasMany.of (node.table, node.members, node.keywords);
// };

// const hasMany = <Params> (tag: RqlTag<Params>): RqlTag<Params> => {
//   return tag.map (node => {
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
//   });
// };

// const hasMany2 = <Params> (tag: RqlTag<Params>) => <Params2>(tag2: RqlTag<Params2>): RqlTag<Params & Params2> => {
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
  ${Table.of ("player")} (limit: 5, offset: 8) {
    id
    x game:games {
      id
      result
    }
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

// playerQuery.run<Player> (config, querier, { id: 1, limit: 5 }).then (players => {
//   console.log (players.map (({ games }) => games));
//   // console.log (players);
// });




const selectPlayer = sql<{id: number}>`
  select * from player
`;

// const paginate = sql<{}, any>`
//   limit 5
//   offset 0
// `;

// const paginate = <Params>(tag: RqlTag<Params> | SqlTag<Params>) =>
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

// const exp = new HasMany ("-");

// const res = exp.cata<string> ({
//   BelongsTo: x => x,
//   HasMany: x => x
// });


// DENK NA OVER NESTEN RQL en ook ${Identifier("last_name")}
const playerAst = rql<{ id: number}>`
  player (id:1) {
    last_name
  }
`;

const teamAst = rql<{ limit: number }>`
  team {
    * 
  }
`;

const RootToBelongsTo = <Params> (node: Root<Params>) =>
  BelongsTo.of (node.table, node.members, node.keywords);

const belongsTo = <Params>(tag: RqlTag<Params>) => <Params2>(tag2: RqlTag<Params2>) => {
  return tag2.map (node => {
    return node.addMember (RootToBelongsTo (tag.node));
  });

};

// console.log (res);
const res = belongsTo (teamAst) (playerAst);

// const res = playerAst.map (node => {
//   return node.addMember (toBelongsTo (teamAst.node));
// });

teamAst.node = BelongsTo.of (Table.of ("team"), [], {});


res.run<Player> ({ caseType: "snake" }, querier, { id: 3, limit: 4 }).then (console.log).catch (e => {
  console.log (e.message);
});
